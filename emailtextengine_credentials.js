//UPDATE THE FOLLOWING 5 PARAMETERS USING YOUR OWN ACCOUNT INFORMATION
var mandrill_api_key = ''; 		// Mandrill API key
var sender_email = ''; 			// patients sees this email address as the sender

var twilio_id = ''; 			// Twilio AccountSID
var twilio_auth = ''; 			// Twilio Auth Token
var twilio_number = '';         // Twilio phone number

//THE GETTER METHODS SHOULDN'T NEED CHANGING
function get_mandrill_api_key(){
  return mandrill_api_key;
}

function get_sender_email(){
  return sender_email;
}

function get_twilio_id(){
  return twilio_id;
}

function get_twilio_auth(){
  return twilio_auth;
}

function get_twilio_number(){
  return twilio_number;
}