import React, { useState } from 'react'
import './form.css'
import './loader.css'

import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { auth } from './firebase.js'
import emailjs from '@emailjs/browser';
import axios from 'axios';

const Form = () => {

	// useEffect( () => {
	// 	const setCaptcha = async () => {
	// 		const verifier = await new RecaptchaVerifier(auth, 'captcha', { size: "invisible" });
	// 		setRecaptchaVerifier(verifier);
	// 	}
	// 	setCaptcha();
	// }, [])

	const emailRegEx = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
	const [recaptchaVerifier, setRecaptchaVerifier] = useState()

	const [formDiv, setFormDiv] = useState(1);
	const [loader, setLoader] = useState(false);
	const [pincodeDataDiv, setPincodeDataDiv] = useState(1);
	const [phoneOTPDiv, setPhoneOTPDiv] = useState(1);
	const [emailOTPDiv, setEmailOTPDiv] = useState(1);

	const [error, setError] = useState(false);

	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('+91');
	const [aadhaar, setAadhaar] = useState('');

	const [nameValid, setNameValid] = useState(true);
	const [emailValid, setEmailValid] = useState(true);
	const [phoneValid, setPhoneValid] = useState(true);
	const [aadhaarValid, setAadhaarValid] = useState(true);

	const [phoneOTP, setPhoneOTP] = useState('');
	const [phoneOTPValid, setPhoneOTPValid] = useState(false);

	const [emailOTP, setEmailOTP] = useState('');
	const [emailOTPValid, setEmailOTPValid] = useState(false);

	const [pincode, setPincode] = useState('');
	const [pincodeData, setPincodeData] = useState([]);
	const [pincodeValid, setPincodeValid] = useState({status: false, initial: true});

	const [phoneOTPResult, setPhoneOTPResult] = useState({})
	const [generatedEmailOTP, setGeneratedEmailOTP] = useState('');

	const onRegisterNext = async () => {
		console.log(phone);
		if(name.length !== 0 && phone.length >= 10 && emailRegEx.test(email) && aadhaar.length >= 12) {
			setLoader(true);
			if(!recaptchaVerifier) {
				const verifier = await new RecaptchaVerifier(auth, 'captcha', { size: "invisible" });
				setRecaptchaVerifier(verifier);
				await sentOTPMethod(verifier);
			}
			else {
				await sentOTPMethod(recaptchaVerifier);
			}
		}
		else {
			setError(true);
		}
	}

	const onPhoneOTPNext = () => {
		setLoader(true);
		phoneOTPResult.confirm(phoneOTP).then(() => {
			sentEmailOTPMethod();
			setFormDiv(3);
			setLoader(false);
        }).catch((_) => {
			setPhoneOTPDiv(2);
			setLoader(false);
        })
	}

	const onEmailOTPNext = () => {
		setLoader(true);
		if(emailOTP === generatedEmailOTP) {
			setFormDiv(4);
			setLoader(false);
		}
		else {
			setEmailOTPDiv(2);
			setLoader(false);
		}
	}

	const onPincodeSubmit = () => {
		setFormDiv(5);
		setName('');
		setEmail('')
		setPhone('+91')
		setAadhaar('');
		setPhoneOTP('')
		setEmailOTP('');
	}

	const onNameChange = (e) => {
		setError(false);
		setName(e.target.value);
		if(e.target.value.length === 0) 
			setNameValid(false);
		else
			setNameValid(true);
	}

	const onPhoneChange = (e) => {
		setError(false);
		setPhone(e.target.value);
		if(e.target.value.length >= 10) 
			setPhoneValid(true);
		else 
			setPhoneValid(false);
	}

	const onEmailChange = (e) => {
		setError(false);
		setEmail(e.target.value);
		if(!emailRegEx.test(e.target.value)) 
			setEmailValid(false);
		else
			setEmailValid(true);
	}

	const onAadhaarChange = (e) => {
		setError(false);
		setAadhaar(e.target.value);
		if(e.target.value.length !== 12) 
			setAadhaarValid(false);
		else
			setAadhaarValid(true);
	}

	const onPhoneOTPChange = (e) => {
		setPhoneOTP(e.target.value);
		if(e.target.value.length < 6) {
			setPhoneOTPValid(false);
		}
		else {
			setPhoneOTPValid(true);
		}
	}

	const onEmailOTPChange = (e) => {
		setEmailOTP(e.target.value);
		if(e.target.value.length < 6) {
			setEmailOTPValid(false);
		}
		else {
			setEmailOTPValid(true);
		}
	}

	const onPincodeChange = (e) => {
		setPincode(e.target.value);
		if(pincodeValid.initial) {
			setPincodeValid({status: false, initial: false})
		}
		if(e.target.value.length === 6) {
			setPincodeValid({status: true, initial: false})
			setPincodeDataDiv(4);
			axios.get(`https://api.postalpincode.in/pincode/${e.target.value}`)
			.then((res) => {
				console.log(res.data[0]);
				if(res.data[0].Status === 'Success') {
					setPincodeData([
						res.data[0].PostOffice[0].Block,
						res.data[0].PostOffice[0].District,
						res.data[0].PostOffice[0].State
					]);
					setPincodeDataDiv(2);
				}
				else {
					setPincodeDataDiv(3);
				}
			}).catch((err) => {
				console.log(err);
				setPincodeDataDiv(3)
			});
		}
		else {
			setPincodeValid({status: false, initial: false})
		}
	}

	const sentOTPMethod = async (argVerifier) => {
		signInWithPhoneNumber(auth, phone, argVerifier).then((result) => {
			setPhoneOTPResult(result);
			setFormDiv(2);
			setLoader(false);
		}).catch((err) => {
			alert('Something Went Wrong');
			console.log(err);
			setLoader(false);
		})
	}

	const sentEmailOTPMethod = () => {
		setLoader(true);
		const randomNumber = Math.floor(Math.random() * 1000000);
		const number = String(randomNumber).padStart(6, '0');
		setGeneratedEmailOTP(number);
		try {
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
			<div className="form-div">
				{
					(formDiv === 1) ? (
						<div className="form-div-one">      {/* Form Div One - Registration Form */} 
							<div className="form-head">Register</div>
							<div className="form-fields">
								<div className="field-div">
									<label>Name :</label>
									<input 
										type="text" 
										placeholder='Name . . .' 
										style={{border: nameValid ? '2px solid #FFFFFF' : '2px solid #FF0000'}}
										onChange={ onNameChange } 
										value={name}
									/>
								</div>
								<div className="field-div">
									<label>Email :</label>
									<input 
										type="text" 
										placeholder='Email address . . .' 
										style={{border: emailValid ? '2px solid #FFFFFF' : '2px solid #FF0000'}}
										onChange={ onEmailChange } 
										value={email}
									/>
								</div>
								<div className="field-div">
									<label>Phone Number :</label>
									<input 
										type="text" 
										placeholder='Phone number . . .' 
										value={phone}
										style={{border: phoneValid ? '2px solid #FFFFFF' : '2px solid #FF0000'}}
										onChange={ onPhoneChange } 
									/>
								</div>
								<div className="field-div">
									<label>Aadhaar Number :</label>
									<input 
										type="text" 
										placeholder='Aadhaar number . . .' 
										style={{border: aadhaarValid ? '2px solid #FFFFFF' : '2px solid #FF0000'}}
										onChange={ onAadhaarChange } 
										value={aadhaar}
									/>
								</div>
								<div className="button-div">
									{ 
										error ? (
											<div className="error-msg">&nbsp;&nbsp;Invalid Inputs</div>
										) : (
											<div className="error-msg">&nbsp;</div>
										)
									}
									<button onClick={onRegisterNext} disabled={error}>Next</button>
								</div>
							</div>
						</div>
					) : (formDiv === 2) ? (
						<div className="form-div-two">      {/* Form Div Two - Verify Phone Number */} 
							<div className="form-head">Verify Phone Number</div> 
							{
								(phoneOTPDiv === 1) ? (
									<div className="form-fields">
										<div className="otp-desc">
											Enter the OTP that we have sent to the number {phone}
										</div>
										<div className="field-div">
											<input 
												type="text" 
												placeholder='XXXXXX' 
												style={{border: phoneOTPValid ? '2px solid #FFFFFF' : '2px solid #FF0000'}}
												onChange={onPhoneOTPChange} 
												value={phoneOTP} 
												autoFocus
											/>
										</div>
										<button onClick={onPhoneOTPNext} disabled={!phoneOTPValid}>Next</button>
									</div>
								) : (phoneOTPDiv === 2) ? (
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
					) : (formDiv === 3) ? (
						<div className="form-div-three">      {/* Form Div Three - Verify Email */} 
							<div className="form-head">Verify Email Address</div>
							{
								(emailOTPDiv === 1) ? (
									<div className="form-fields">
										<div className="otp-desc">
											Enter the OTP that we have sent to the email {email}
										</div>
										<div className="field-div">
											<input 
												type="text" 
												placeholder='XXXXXX' 
												style={{border: emailOTPValid ? '2px solid #FFFFFF' : '2px solid #FF0000'}}
												onChange={onEmailOTPChange} 
												value={emailOTP} 
												autoFocus
											/>
										</div>
										<button onClick={onEmailOTPNext} disabled={!emailOTPValid}>Next</button>
									</div>
								) : (emailOTPDiv === 2) ? (
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
					) : (formDiv === 4) ? (
						<div className="form-div-one">      {/* Form Div Four - Pincode */} 
							<div className="form-head">Address</div>
							<div className="form-fields">
								<div className="field-div">
									<label>Pincode :</label>
									<input 
										type="text" 
										placeholder='Enter pincode . . .' 
										onChange={onPincodeChange} 
										value={pincode}
										autoFocus
										style={{border: (pincodeValid.status || pincodeValid.initial) ? '2px solid #FFFFFF' : '2px solid #FF0000'}}
									/>
								</div>
								{
									(pincodeDataDiv === 1) ? (
										<div className="initial-div"> . . .</div>
									) : (pincodeDataDiv === 2) ? (
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
									) : (pincodeDataDiv === 3) ? (
										<div className="not-found-div">
											Address Not Found
										</div>
									) :  (pincodeDataDiv === 4) ? (
										<div className="lds-ellipsis" style={{margin: '0 auto 0 auto'}}>
											<div></div>
											<div></div>
											<div></div>
											<div></div>
										</div>
									) : null
								}
								
								<button onClick={onPincodeSubmit} disabled={pincodeData.length < 3}>Submit</button>
							</div>
						</div>
					) : (formDiv === 5) ? (
						<div className="form-fields">
							<div className="form-head" style={{padding: '0 0 20px 0'}}>Registratin Completed</div>
							<div className="error-msg" style={{margin: '0 0 20px 0', textAlign: 'center', color: `#00FF00`}}>
								Your Registration Was Succesfull
							</div>
							<div className="button-div">
								<button onClick={()=>{setFormDiv(1)}}>Done</button>
							</div>
						</div>
					) : null
				}
			</div>
		)
		
	}
	<div id="captcha"></div>
	</div>
}

export default Form