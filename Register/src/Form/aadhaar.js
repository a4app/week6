// const axios = require('axios');

// const encodedParams = new URLSearchParams();
// encodedParams.set('txn_id', '17c6fa41-778f-49c1-a80a-cfaf7fae2fb8');
// encodedParams.set('consent', 'Y');
// encodedParams.set('uidnumber', '852846980220');
// encodedParams.set('clientid', '222');
// encodedParams.set('method', 'uidvalidatev2');

// const options = {
//   method: 'POST',
//   url: 'https://verifyaadhaarnumber.p.rapidapi.com/Uidverifywebsvcv1/VerifyAadhaarNumber',
//   headers: {
//     'content-type': 'application/x-www-form-urlencoded',
//     'X-RapidAPI-Key': '136e0d511bmsh20f7fe9d06e90b5p1408bcjsn42c942475f88',
//     'X-RapidAPI-Host': 'verifyaadhaarnumber.p.rapidapi.com'
//   },
//   data: encodedParams,
// };

// try {
// 	const response = await axios.request(options);
// 	console.log(response.data);
// } catch (error) {
// 	console.error(error);
// }