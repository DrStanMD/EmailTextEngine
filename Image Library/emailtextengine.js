//The following are Global Variables that gets initiated with when the window is loaded. 
var patientCell;
var patientEmail; 
var ecnt;
var initiated = false;

//On load, initiate the EmailTextEngine variables
window.addEventListener("load",function(){
  startETEngine();
});

function openConsentForm(){
  openForm("Email Text Consent Form");
}

//Open eForm by formName
function openForm(formName){
  //1) open the eForm list window
  var pathArray = window.location.pathname.split( '/' );
  var newURL = window.location.protocol + "//" + window.location.host +"/"+pathArray[1]+"/eform/efmformslistadd.jsp?demographic_no="+getDemoNo();
  var eFormListWindow = window.open(newURL);

  eFormListWindow.addEventListener("load", function(){
    //2) find all <a> elements
    var a_array = this.document.links;
    for(var i=0;i<a_array.length;i++){
      var a = a_array[i];
      //3)find the first <a> element that has the formName in its innerHTML
      if(a.innerHTML.indexOf(formName)>-1){
        //4) click that <a> then close this window
        a.click();
        eFormListWindow.close();
        return;
      }
    }
  }, false);
}

// sending an email through Mandrill, needs an API key from www.mandrill.com
function sendEmail(newsubject, newbody){
  // if the Engine has not started, start it
  if(!initiated)
    startETEngine();
  // if there is no email consent, do NOT continue
  if(!emailConsented()){
    alert("No email consent");
    return;
  }
  // confirm that the user really wants to send an email to the patient
  var confirmSend = confirm("Sending: \""+newbody+"\" to "+patientEmail);
  if(!confirmSend){
    return;
  }

  var m = new mandrill.Mandrill(get_mandrill_api_key());

  var params = {
    "message": {
      "from_email":get_sender_email(),
      "to": [{"email": patientEmail}],
      "subject": newsubject,
      "text": newbody
    }
  };
  m.messages.send(params, function(res){
    if (res[0]["status"]=="sent"){      //email successfully sent
      alert("Email sent to "+patientEmail+". Message: "+newbody);
    }
  }, function(err){                     //email could not be sent
    console.log(err);
    alert("Email send error:"+err);
  });
}

function sendText(body){
  //same logic as sendEmail()
  if(!initiated)
    startETEngine();

  if(!textConsented()){
    alert("No text consent");
    return;
  }
  var confirmSend = confirm("Sending: \""+body+"\" to "+patientCell);
  if(!confirmSend){
    return;
  }

  var twilio_id = get_twilio_id();
  var twilio_auth = get_twilio_auth();
  var url = "https://"+twilio_id+":"+twilio_auth+"@api.twilio.com/2010-04-01/Accounts/"+twilio_id+"/Messages";

  //using a form in a hidden iframe to send a POST to Twilio Server. Please suggest improvement if you have a simpler way to send to twilio.
  var form = document.createElement("form");
  form.setAttribute("method", "POST");
  form.setAttribute("action", url);
  form.target = "hiddenFrame";

  var fromField = document.createElement("input");
  fromField.type = "hidden";
  fromField.name = "From";
  fromField.value = get_twilio_number();
  form.appendChild(fromField);

  var toField = document.createElement("input");
  toField.type = "hidden";
  toField.name = "To";
  toField.value = patientCell;
  form.appendChild(toField);


  var bodyField = document.createElement("input");
  bodyField.type = "hidden";
  bodyField.name = "Body";
  bodyField.value = body;
  form.appendChild(bodyField);

  document.body.appendChild(form);

  var hiddenFrame = document.createElement("iframe");
  hiddenFrame.name = "hiddenFrame";
  hiddenFrame.setAttribute("hidden",true);
  document.body.appendChild(hiddenFrame);

  form.submit();
}

// getting the email and cellphone from the patient's demographic data page https://___/___//demographic/demographiccontrol.jsp?displaymode=edit&dboperation=search_detail&demographic_no=____"
// assigning the email and cellphone to global variables for the other methods to use 
function getPatientEmailAndText(){
  var xmlhttp= new XMLHttpRequest();
  var pathArray = window.location.pathname.split( '/' );
  var newURL = window.location.protocol + "//" + window.location.host +"/"+pathArray[1]+"/demographic/demographiccontrol.jsp?displaymode=edit&dboperation=search_detail&demographic_no="+getDemoNo();
  xmlhttp.onreadystatechange=function(){
    if (xmlhttp.readyState==4 && xmlhttp.status==200){
      var str=xmlhttp.responseText; 
      if (!str) { return; }
      var myRe = /Email:<\/span>\n\s*<span class="info">(.*)<\/span>/i;  
      var myArray;
      var i=0;
      if((myArray = myRe.exec(str))!== null){
        patientEmail = myArray[1];
      }   
      myRe = /Cell Phone:<\/span>\n\s*<span class="info">(.*)<\/span>/i;
      if((myArray= myRe.exec(str))!==null){
        patientCell = makeTwilioFriendly(myArray[1]);
      }
    }
  }
  xmlhttp.open("GET",newURL,false);
  xmlhttp.send();
}

// finding the demographic number in three ways: 1) finding demographic_no in URL, 2) finding demographicNo in URL, 3) finding demo= in the whole webpage
// return the value found by 1); if 1) returned nothing, go to 2)'s value; if 1) and 2) returned nothing, go to 3)'s value. 
function getDemoNo(){
  var myRe0 = /demographic_no=(\d*)[&^]/g;
  var myRe1 = /demographicNo=(\d*)[&^]/g;
  var myRe2 = /demo=(\d*)[&^]/g;
  var results0 = myRe0.exec(document.URL);
  var results1 =  myRe1.exec(document.URL);
  var results2 =  myRe2.exec(document.body.innerHTML);

  var myArray = results0 || results1 || results2;

  var demoNo = myArray[1];
  return demoNo;
}

// Initiating the EmailTextEngine. 
function startETEngine(){
  //If it has been iniated already, do nothing further
  if(initiated)
    return;
  
  //Inserting javascripts from the Image Library to the head of the page that is loading the EmailTextEngine.
  var head = document.getElementsByTagName("head")[0];
  var pathArray = window.location.pathname.split( '/' );
  
  var newURL = window.location.protocol + "//" + window.location.host +"/"+pathArray[1]+"/eform/displayImage.do?imagefile=mandrill_nostringify.js";
  var mandrill_script = document.createElement('script');
  mandrill_script.type = 'text/javascript';
  mandrill_script.src = newURL; 
  head.appendChild(mandrill_script);

  newURL = window.location.protocol + "//" + window.location.host +"/"+pathArray[1]+"/eform/displayImage.do?imagefile=emailtextengine_credentials.js";
  var credential = document.createElement('script');
  credential.type = 'text/javascript';
  credential.src = newURL;
  head.appendChild(credential);

  //Initiating patient's contact information and consent information
  getPatientEmailAndText();
  getECNTMeasurement();

  //Finding all EmailTextEngine buttons on the page
  var emailButtons = document.getElementsByName("EmailButton");
  var textButtons = document.getElementsByName("TextButton");
  var consentButtons = document.getElementsByName("ConsentButton");

  //For the EmailButtons
  for(var i=0;i<emailButtons.length;i++){
    var emailButton = emailButtons[i];
    //If it does exist
    if(emailButton!==null){
      //if there is no consent for email, disable the button 
      if(!emailConsented()){
        emailButton.disabled = true;
        emailButton.value = "No email consent";
      }
      //if they have consented, but if the patient's email is not present in the EMR, disable the button
      else if(patientEmail==null||patientEmail.length<1){
          emailButton.value = "No email on file";
          emailButton.disabled = true;
      }
      //if they have consented and has an email on file, put the email on the button leave it enabled
      else{
        emailButton.value = "Email: "+patientEmail;
      }
    }
  }

  //same logic as EmailButtons
  for (var i=0;i<textButtons.length;i++){
    var textButton = textButtons[i];
    if(textButton!==null){
      if(!textConsented()){
        textButton.disabled = true;
        textButton.value = "No text consent";
      }
      else if(patientCell==null||patientCell.length<1){
        textButton.value = "No cellphone on file";
        textButton.disabled = true;
      }
      else{
        textButton.value ="Text: "+patientCell;
      }
    }
  }

  for (var i=0;i<consentButtons.length;i++){
    var consentButton = consentButtons[i];
    if(consentButton!==null){
      // if the ECNT value is "none", it means the patient has indicated that they do not want to receive email or phone calls
      if(ecnt=="none"){
        consentButton.value = "Do NOT email or text (click to change consent)";
      }
      // if there is no previous ECNT information, the patient hasn't been asked
      else if(ecnt==null||ecnt==""){
        consentButton.value = "Get Consent first";
      }
    }
  }

  initiated = true;
}

// if the ecnt value is "email" or "both", then the patient has consented to receive emails
function emailConsented(){
  if(ecnt==null||!ecnt.length>0)
    return false;
  if(ecnt.indexOf("email")>-1||ecnt.indexOf("both")>-1)
    return true;
  else
    return false;
}

// if the ecnt value is "text" or "both", then the patient has consented to receive texts
function textConsented(){
  if(ecnt==null||!ecnt.length>0)
    return false;
  if(ecnt.indexOf("text")>-1||ecnt.indexOf("both")>-1)
    return true;
  else
    return false;
}


// getting the measurement value by visiting the http://__/__/oscarEncounter/oscarMeasurements/SetupDisplayHistory.do?type=ECNT page
function getECNTMeasurement(){
  var emailConsent;
  var xmlhttp= new XMLHttpRequest();
  var pathArray = window.location.pathname.split( '/' );
  var newURL = window.location.protocol + "//" + window.location.host +"/"+pathArray[1]+"/oscarEncounter/oscarMeasurements/SetupDisplayHistory.do?type=ECNT";
  xmlhttp.onreadystatechange=function(){
    if (xmlhttp.readyState==4 && xmlhttp.status==200){
      var str=xmlhttp.responseText; 
      if (!str) { return; }

      // this method relies on the most current ECNT value being in the first <td width="10">___</td> tag on the page
      var myRe = /<td width="10">(.*)<\/td>/;  
      var myArray;
      var i=0;
      if((myArray = myRe.exec(str))!== null){
        emailConsent = myArray[1];
      }   
    }
  }
  xmlhttp.open("GET",newURL,false);
  xmlhttp.send();
  ecnt = emailConsent;
}

function makeTwilioFriendly(oldString){
  //strip out all non-digit characters
  var newString = oldString.replace(/\D/g,'');

  //need to start with +1 followed by the 10 digit phone number
  if(newString==null||newString.length==0)
    return null;
  if(newString.length==10){
    newString = '+1'+newString;
    return newString;
  }
  else if(newString.length==11&&newString.charAt(0)=='1'){
    newString = '+'+newString;
    return newString;
  }
  return null;
}