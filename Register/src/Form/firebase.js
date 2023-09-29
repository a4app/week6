import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// const firebaseConfig = {
// 	apiKey: "AIzaSyBWwssAkTeUofeh00BVMzzO_ZgNyURABL8",
// 	authDomain: "reactapp-263.firebaseapp.com",
// 	projectId: "reactapp-263",
// 	storageBucket: "reactapp-263.appspot.com",
// 	messagingSenderId: "227675856254",
// 	appId: "1:227675856254:web:ca118ebb4b43cfb872e72f"
// };
const firebaseConfig = {
	apiKey: "AIzaSyDIvIlWXv9eCWsHsnE04fpneApgLBjbRN4",
	authDomain: "register-263.firebaseapp.com",
	projectId: "register-263",
	storageBucket: "register-263.appspot.com",
	messagingSenderId: "307768434463",
	appId: "1:307768434463:web:d4e5fbcb75cecdbc245a2a"
  };

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);