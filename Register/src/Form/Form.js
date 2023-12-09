import React, { useState } from 'react'
import './form.css'
import './loader.css'

import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from './firebase.js'
import emailjs from '@emailjs/browser';
import axios from 'axios';
import { toast } from 'react-toastify';

const Form = () => {

	const emailRegEx = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	const [recaptchaVerifier, setRecaptchaVerifier] = useState()

	// 1.main page  2.phone otp  3.email otp  4.pincode  5.succesfull regs
	const [formDiv, setFormDiv] = useState(1);

	const [loader, setLoader] = useState(false);

	// 1.starting(...)  2.pincode data  3.not found  4.loader
	const [pincodeDataDiv, setPincodeDataDiv] = useState(1);

	// 1.enter otp  2.verification failed
	const [phoneOTPDiv, setPhoneOTPDiv] = useState(1);

	// 1.enter otp  2.verification failed
	const [emailOTPDiv, setEmailOTPDiv] = useState(1);

	const [aadhaarOverlay, setAadhaarOverlay] = useState(false)

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('+91');
	const [aadhaar, setAadhaar] = useState('');

	const [errorMessages, setErrorMessages] = useState({
		name: '',
		email: '',
		phone: '',
		aadhaar: '',
		phoneOTP: '',
		emailOTP: '',
	})

	const [phoneOTP, setPhoneOTP] = useState('');
	const [emailOTP, setEmailOTP] = useState('');

	const [pincode, setPincode] = useState('');
	const [pincodeData, setPincodeData] = useState([]);

	const [phoneOTPResult, setPhoneOTPResult] = useState({})
	const [generatedEmailOTP, setGeneratedEmailOTP] = useState('');

	const onRegisterNext = async () => {

		// error messages
		const errors = { name: '', email: '', phone: '', aadhaar: '', phoneOTP: '', emailOTP: '', pincode: '', }
		
		// validate fields
		if( name === '' || email === '' || !emailRegEx.test(email) || phone === '' ||phone.length !== 13 || aadhaar === '' || aadhaar.length !== 12 || isNaN(aadhaar) ) {
			if(name === '') errors.name = 'required *';

			if(email === '') errors.email = 'required *';
			else if(!emailRegEx.test(email)) errors.email = 'invalid email !';

			if(phone === '') errors.phone = 'required *';
			else if(phone.length !== 13) errors.phone = 'invalid phone number !';

			if(aadhaar === '') errors.aadhaar = 'required *';
			else if(aadhaar.length !== 12 || isNaN(aadhaar)) errors.aadhaar = 'invalid aadhaar number !'

		}
		else {
			setLoader(true);

			// verify entered aadhaar number
			const encodedParams = new URLSearchParams();
			encodedParams.set('txn_id', '17c6fa41-778f-49c1-a80a-cfaf7fae2fb8');
			encodedParams.set('consent', 'Y');
			encodedParams.set('uidnumber', aadhaar);
			encodedParams.set('clientid', '222');
			encodedParams.set('method', 'uidvalidatev2');

			const options = {
				method: 'POST',
				url: 'https://verifyaadhaarnumber.p.rapidapi.com/Uidverifywebsvcv1/VerifyAadhaarNumber',
				headers: {
					'content-type': 'application/x-www-form-urlencoded',
					'X-RapidAPI-Key': '136e0d511bmsh20f7fe9d06e90b5p1408bcjsn42c942475f88',
					'X-RapidAPI-Host': 'verifyaadhaarnumber.p.rapidapi.com'
				},
				data: encodedParams,
			};

			try {
				const response = await axios.request(options);
				console.log(Object.keys(response.data));

				// succesfull aadhaar verification
				if(response.data.Succeeded) {
					toast.success('Aadhaar verification succesfull');

					if(!recaptchaVerifier) {
						const verifier = await new RecaptchaVerifier(auth, 'captcha', { size: "invisible" });
						setRecaptchaVerifier(verifier);
						// call method to send OTP to phone
						sentOTPMethod(verifier);
					}
					else {
						setLoader(false)
						sentOTPMethod(recaptchaVerifier);
					}
				}
				// failed aadhaar verification
				else {
					setLoader(false)
					setAadhaarOverlay(true)
				}
			} catch (error) {
				console.error(error);
				setAadhaarOverlay(true)
			}


		}
		setErrorMessages(errors)
	}

	const onPhoneOTPNext = () => {
		setLoader(true);
		// validate entered phone OTP
		if(phoneOTP.length !== 6 || isNaN(phoneOTP)) {
			if(phoneOTP === '') setErrorMessages((err) => ({ ...err, phoneOTP: 'required *' }))
			else setErrorMessages((err) => ({ ...err, phoneOTP: 'invalid OTP' }))
			setLoader(false)
		}
		else {
			// verify OTP
			phoneOTPResult.confirm(phoneOTP).then(() => { // succesfull verification of phoneOTP
				// call method to sent OTP to email
				sentEmailOTPMethod();
				setFormDiv(3);
				setLoader(false);
			}).catch((_) => {	// failed verification of phoneOTP
				setPhoneOTPDiv(2);
				setLoader(false);
			})
		}
		
	}

	const onEmailOTPNext = () => {
		setLoader(true);
		// validate emailOTP
		if(emailOTP.length !== 6 || isNaN(emailOTP)) {
			if(emailOTP === '') setErrorMessages((err) => ({ ...err, emailOTP: 'required *' }))
			else setErrorMessages((err) => ({ ...err, emailOTP: 'invalid OTP !' }))
			setLoader(false)
		}
		else {
			// verify email otp
			if(emailOTP === generatedEmailOTP) { // succesfull vefitication
				setFormDiv(4);
				setLoader(false);
			}	
			else {	// faiiled verification
				setEmailOTPDiv(2);
				setLoader(false);
			}
		}
	}

	const onPincodeSubmit = async () => {
		// check if pincode data is set
		if(pincodeData.length < 3) {
			toast.warning('Enter a valid pincode', { autoClose: 2000})
		}
		else {
			setFormDiv(5);
			setName('');
			setEmail('')
			setPhone('+91')
			setAadhaar('');
			setPhoneOTP('')
			setEmailOTP('');
		}
	}

	const onPincodeChange = (e) => {
		setPincode(e.target.value);
		if(e.target.value.length === 6) {
			setPincodeDataDiv(4);
			// get pincode data
			axios.get(`https://api.postalpincode.in/pincode/${e.target.value}`).then((res) => {
				// valid pincode
				if(res.data[0].Status === 'Success') {
					// set pincode data from response
					setPincodeData([
						res.data[0].PostOffice[0].Block,
						res.data[0].PostOffice[0].District,
						res.data[0].PostOffice[0].State
					]);
					setPincodeDataDiv(2);
				}
				// invalid pincode
				else {
					setPincodeDataDiv(3);
				}
			}).catch((err) => {
				console.log(err);
				setPincodeDataDiv(3)
			});
		}
	}

	const sentOTPMethod = (argVerifier) => {
		setLoader(true);
		// send OTP to phone number
		signInWithPhoneNumber(auth, phone, argVerifier).then((result) => {
			setPhoneOTPResult(result);
			setFormDiv(2);
			setLoader(false);
		}).catch((err) => {
			toast.error('Something went wrong !')
			console.log(err);
			setLoader(false);
		})
	}

	const sentEmailOTPMethod = () => {
		setLoader(true);
		const randomNumber = Math.floor(Math.random() * 1000000);
		const number = String(randomNumber).padStart(6, '0'); // gerate 6 digit OTP
		setGeneratedEmailOTP(number);
		try {
			// send generated OTP to email
			emailjs.send("service_56utgyq","template_tllr6o9",{
				name: name,
				otp: number,
				email_id: email,
			},'cEpMQYfu0Ydrq5uPx');
			setLoader(false);
		}
		catch(err) {
			alert('Something Went Wrong');
			setLoader(false);
			setFormDiv(1);
		}
	}

	return <div className="main">
		{
			(loader) ? (
				<div className="lds-ellipsis">
					<div></div>
					<div></div>
					<div></div>
					<div></div>
				</div>
			) : (
				(aadhaarOverlay) ? (
					<div className="aadhaar-overlay">
						<div className='error-text'>Aadhaar number {aadhaar} is not valid</div>
						<button style={{backgroundColor: '#ee4400'}} onClick={() => {
							setAadhaarOverlay(false)
						}}>Back</button>
					</div>
				) : (
					<div className="form-div">
						{
							(formDiv === 1) ? (      	/* Form Div One - Registration Form */
								<div className="form-div-one">
									<div className="form-head">Register</div>
									<div className="form-fields">
										<div className="field-div">
											<div className="field-div-top">
												<label>Name :</label>
												<span>{ errorMessages.name }</span>
											</div>
											<input 
												type="text" 
												placeholder='Name . . .' 
												onChange={ e => setName(e.target.value) } 
												value={name}
											/>
										</div>
										<div className="field-div">
											<div className="field-div-top">
												<label>Email :</label>
												<span>{ errorMessages.email }</span>
											</div>
											<input 
												type="text" 
												placeholder='Email address . . .' 
												onChange={ e => setEmail(e.target.value) }
												value={email}
											/>
										</div>
										<div className="field-div">
											<div className="field-div-top">
												<label>Phone :</label>
												<span>{ errorMessages.phone }</span>
											</div>
											<input 
												type="text" 
												placeholder='Phone number . . .' 
												value={phone}
												onChange={ e => setPhone(e.target.value) }
											/>
										</div>
										<div className="field-div">
											<div className="field-div-top">
												<label>Aadhaar :</label>
												<span>{ errorMessages.aadhaar }</span>
											</div>
											<input 
												type="text" 
												placeholder='Aadhaar number . . .' 
												onChange={ e => setAadhaar(e.target.value) }
												value={aadhaar}
											/>
										</div>
										<div className="button-div">
											<button onClick={onRegisterNext} >Next</button>
										</div>
									</div>
								</div>
							) : (formDiv === 2) ? (		/* Form Div Two - Verify Phone Number */
								<div className="form-div-two">      
									<div className="form-head">Verify Phone Number</div> 
									{
										(phoneOTPDiv === 1) ? ( /* Enter phoneOTP */
											<div className="form-fields">
												<div className="otp-desc">
													Enter the OTP that we have sent to the number {phone}
												</div>
												<span className='error-messages' style={{textAlign: 'right'}}>{errorMessages.phoneOTP}</span>
												<div className="field-div">
													<input 
														type="text" 
														placeholder='XXXXXX'
														onChange={ e => setPhoneOTP(e.target.value) } 
														value={phoneOTP} 
														autoFocus
													/>
												</div>
												<button onClick={onPhoneOTPNext}  >Next</button>
											</div>
										) : (phoneOTPDiv === 2) ? ( /* verification failed */
											<div className="form-fields">
												<div className="error-msg" style={{margin: '0 0 20px 0', textAlign: 'center'}}>
													Verification Failed
												</div>
												<div className="button-div">
													<button style={{margin: '0', background: '#F94F4F'}} onClick={()=>{setFormDiv(1)}}>Cancel</button>
													<button onClick={()=>{sentOTPMethod(); setPhoneOTPDiv(1); setPhoneOTP('')}}>Resent</button>
												</div>
											</div>
										) : null
									}
								</div>
							) : (formDiv === 3) ? (     /* Form Div Three - Verify Email */
								<div className="form-div-three">
									<div className="form-head">Verify Email Address</div>
									{
										(emailOTPDiv === 1) ? ( /* enter emailOTP */
											<div className="form-fields">
												<div className="otp-desc">
													Enter the OTP that we have sent to the email {email}
												</div>
												<span className='error-messages' style={{textAlign: 'right'}}>{errorMessages.emailOTP}</span>
												<div className="field-div">
													<input 
														type="text" 
														placeholder='XXXXXX' 
														onChange={ e => setEmailOTP(e.target.value) }
														value={emailOTP} 
														autoFocus
													/>
												</div>
												<button onClick={onEmailOTPNext} >Next</button>
											</div>
										) : (emailOTPDiv === 2) ? ( /* verification failed */
											<div className="form-fields">
												<div className="error-msg" style={{margin: '0 0 20px 0', textAlign: 'center'}}>
													Verification Failed
												</div>
												<div className="button-div">
													<button style={{margin: '0', background: '#F94F4F'}} onClick={()=>{setEmailOTPDiv(1); setFormDiv(1)}}>Cancel
													</button>
													<button onClick={()=>{setEmailOTPDiv(1); setEmailOTP(''); sentEmailOTPMethod()}}>Resent</button>
												</div>
											</div>
										) : null
									}
								</div>
							) : (formDiv === 4) ? (		/* Form Div Four - Pincode */
								<div className="form-div-one">      
									<div className="form-head">Address</div>
									<div className="form-fields">
										<div className="field-div">
											<label>Pincode :</label>
											<input 
												type="text" 
												placeholder='Enter pincode . . .' 
												// onChange={ e => setPincode(e.target.value) } 
												onChange={ onPincodeChange } 
												value={pincode}
												autoFocus
											/>
										</div>
										{
											(pincodeDataDiv === 1) ? ( /* starting ( . . . ) */
												<div className="initial-div"> . . .</div>
											) : (pincodeDataDiv === 2) ? (	/* display pincode data- city, dist... */
												<div className="address-div">
													<div className="field-div">
														<label>City :</label>
														<div type="text" className='text-box'>{pincodeData[0]}&nbsp;</div>
													</div>
													<div className="field-div">
														<label>District :</label>
														<div type="text" className='text-box'>{pincodeData[1]}&nbsp;</div>
													</div>
													<div className="field-div">
														<label>State :</label> 
														<div type="text" className='text-box'>{pincodeData[2]}&nbsp;</div>
													</div>
												</div>
											) : (pincodeDataDiv === 3) ? (	/* address not found */
												<div className="not-found-div">
													Address Not Found
												</div>
											) :  (pincodeDataDiv === 4) ? (	/* loader div */
												<div className="lds-ellipsis" style={{margin: '0 auto 0 auto'}}>
													<div></div>
													<div></div>
													<div></div>
													<div></div>
												</div>
											) : null
										}
										
										<button onClick={onPincodeSubmit} >Submit</button>
									</div>
								</div>
							) : (formDiv === 5) ? (		/* registration succesfull */
								<div className="form-fields">
									<div className="form-head" style={{padding: '0 0 20px 0'}}>Registratin Completed</div>
									<div className="error-msg" style={{margin: '0 0 20px 0', textAlign: 'center', color: `#00FF00`}}>
										Your Registration Was Succesfull
									</div>
									<div className="button-div">
										<button onClick={()=>{setFormDiv(1)}}>Done</button>
									</div>
								</div>
							) : <></>
						}
					</div>
				)
				
			)
			
		}
		<div id="captcha"></div>
	</div>
}

export default Form