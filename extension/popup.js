document.addEventListener('DOMContentLoaded', function() {

  document.getElementById("btn_format").addEventListener('click', function() { doPrettify(); }, false);
  document.getElementById("step1pill").addEventListener('click', function() { toggleDisplay("txt_step1fb"); }, false);
  document.getElementById("step2pill").addEventListener('click', function() { toggleDisplay("txt_step2fb"); }, false);
  document.getElementById("step3pill").addEventListener('click', function() { toggleDisplay("txt_step3fb"); }, false);
  document.getElementById("txt_inputxml").addEventListener('click', function() { updateTextboxInfo(); }, false);
  document.getElementById("txt_inputxml").addEventListener('keyup', function() { updateTextboxInfo(); }, false);
  document.getElementById("btn_resetXsdCache").addEventListener('click', function() { resetXsdCache(); }, false);


}, false);

(window.onpopstate = function() {
  const urlParams = new URLSearchParams(window.location.search);

  var value = localStorage.getItem(urlParams.get('data'));
  document.getElementById("txt_inputxml").value = value;

  if (value != "" && value != null)
    doPrettify();

  localStorage.removeItem(urlParams.get('data'));
})();

// **************************** Core functionality *****************************
function updateTextboxInfo() {
  var textarea = document.getElementById("txt_inputxml");
  var textLines = textarea.value.substr(0, textarea.selectionStart).split("\n");
  document.getElementById("txt_inputxml_info").innerHTML = "row: " + textLines.length + " column: " + (textLines[textLines.length - 1].length + 1);
}

function doPrettify() {
  var input = document.getElementById('txt_inputxml');
  var step1fb = document.getElementById('txt_step1fb');
  var step2fb = document.getElementById('txt_step2fb');
  var step3fb = document.getElementById('txt_step3fb');

  try {
    result = prettify(clean(input.value));
    updateStepState("step1pill", "txt_step1fb", true, "OK", "");

    input.value = result.formatted;

    var xsdPayload = getXsdPayload(result.schema);
    if (xsdPayload == null) //Likely because of async.Would be better to fix some async stuff I guess
      throw new XsdLoadException("Could not load XSD to validate against. Tried fetching it at " + getUrl(result.schema) +
        ". Retrying could solve this issue.");

    updateStepState("step2pill", "txt_step2fb", true, "Loaded", xsdPayload);

    var Module = {
      xml: input.value,
      schema: step2fb.value,
      arguments: ["--noout", "--schema", "inputxsd", "inputxml"]
    };

    var validationResult = validateXML(Module);
    if (!validationResult.includes("inputxml validates"))
      throw new XsdValidationException(validationResult);

    updateStepState("step3pill", "txt_step3fb", true, "Valid", "");

  } catch (e) {
    if (e instanceof XmlParseException) {
      updateStepState("step1pill", "txt_step1fb", false, "Invalid", e.message);
    } else if (e instanceof XsdLoadException) {
      updateStepState("step2pill", "txt_step2fb", false, "Not Loaded", e.message);
    } else if (e instanceof XsdValidationException) {
      updateStepState("step3pill", "txt_step3fb", false, "Invalid", e.message);
    } else
      throw e;
  }
}

function updateStepState(pill, fbBlock, success, pillText, message) {
  document.getElementById(fbBlock).value = message;
  setDisplay(fbBlock, !success);
  updatePillState(pill, success, pillText);
}

function updatePillState(element, success, text) {
  var lmnt = document.getElementById(element);

  if (success) {
    lmnt.classList.add("badge-success");
    lmnt.classList.remove("badge-danger");
  } else {
    lmnt.classList.add("badge-danger");
    lmnt.classList.remove("badge-success");
  }

  lmnt.innerHTML = text;
}

function getUrl(filename) {
  var url = "https://www.socialsecurity.be/docu_xml/";
  var rgx = (/([A-Z a-z]*)(\d*)_(\d*)/g).exec(filename)

  switch (rgx[1]) {
    case "ZIMA":
      url = url.concat("drs/inami/");
      if (rgx[2] == "001") url = url.concat("scen1/");
      else if (rgx[2] == "002") url = url.concat("scen2/");
      else if (rgx[2] == "003") url = url.concat("scen3/");
      else if (rgx[2] == "005") url = url.concat("scen5/");
      else if (rgx[2] == "006") url = url.concat("scen6/");
      break;
    case "AADD":
      url = url.concat("drs/inami/scen7/");
      break;
    case "WECH":
      url = url.concat("drs/onem/");
      if (rgx[2] == "001") url = url.concat("scen1/");
      else if (rgx[2] == "003") url = url.concat("scen3/");
      else if (rgx[2] == "005") url = url.concat("scen5/");
      else if (rgx[2] == "002") url = url.concat("scen2/");
      else if (rgx[2] == "006") url = url.concat("scen6/");
      else if (rgx[2] == "007") url = url.concat("scen7/");
      else if (rgx[2] == "008") url = url.concat("scen8/");
      else if (rgx[2] == "009") url = url.concat("scen9/");
      else if (rgx[2] == "010") url = url.concat("scen10/");
      else if (rgx[2] == "011") url = url.concat("scen11/");
      break;
    case "IDFLUX":
      url = url.concat("idflux/");
      break;
    case "ACRF":
      url = url.concat("acr/");
      break;
    case "NOTIFICATION":
      url = url.concat("noti/");
      break;
    case "DmfAOriginal":
      url = url.concat("dmfa/");
      break;
    case "DmfAUpdate":
      url = url.concat("dmfaupdate/");
      break;
    case "DmfAUpdateNotification":
      url = url.concat("dmfaupdatenotification/");
      break;
    case "BewareNotification":
      url = url.concat("beware/");
      break;
    case "DmfAConsultationRequest":
      url = url.concat("dmfarequest/");
      break;
    case "DmfAConsultationAnswer":
      url = url.concat("dmfaanswer/");
      break;
    case "DmfAPID":
      url = url.concat("dmfapid/");
      break;
    case "GenericXmlDocument":
      url = url.concat("genericxml/");
      break;
    case "ReductionConsultationAnswer":
      url = url.concat("redcoanswer/");
      break;
    case "EcoUnemploymentDaysConsultAnswer":
      url = url.concat("ecounemploymentdaysconsultanswer/");
      break;
  }

  return url.concat(filename);
}

function getXsdPayload(filename) {
  var localPayload = localStorage.getItem(filename);
  if (localPayload != null)
    return localPayload;

  const proxyurl = "https://cors-anywhere.herokuapp.com/";
  var url = getUrl(filename);
  fetch(proxyurl + url)
    .then(response => response.text())
    .then(contents => {
      if (contents != "")
        if (contents != null)
          if (!contents.includes("DOCTYPE html")) //404 error
            localStorage.setItem(filename, contents);
    })
    .catch(
      () => console.log("Can’t access " + url + " response. Blocked by browser?")
    )

  return localStorage.getItem(filename);
}

function resetXsdCache() {
  localStorage.clear();
}

function clean(sourceXml) {
  return sourceXml.split('\\"').join('"');
}

function prettify(sourceXml) {
  var xmlDoc = new DOMParser().parseFromString(sourceXml, 'application/xml');
  var xsltDoc = new DOMParser().parseFromString([
    // describes how we want to modify the XML - indent everything
    '<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform">',
    '  <xsl:strip-space elements="*"/>',
    '  <xsl:template match="para[content-style][not(text())]">', // change to just text() to strip space in text nodes
    '    <xsl:value-of select="normalize-space(.)"/>',
    '  </xsl:template>',
    '  <xsl:template match="node()|@*">',
    '    <xsl:copy><xsl:apply-templates select="node()|@*"/></xsl:copy>',
    '  </xsl:template>',
    '  <xsl:output indent="yes"/>',
    '</xsl:stylesheet>',
  ].join('\n'), 'application/xml');

  var xsltProcessor = new XSLTProcessor();
  xsltProcessor.importStylesheet(xsltDoc);
  var resultDoc = xsltProcessor.transformToDocument(xmlDoc);
  var resultXml = new XMLSerializer().serializeToString(resultDoc);

  if (resultDoc.all[1].localName == "parsererror") {
    throw new XmlParseException(resultDoc.all[1].innerText + resultDoc.all[5].outerHTML);
  }
  if (resultDoc.all[2].localName == "parsererror") {
    throw new XmlParseException(resultDoc.all[2].innerText + resultDoc.all[5].outerHTML);
  }

  return {
    formatted: resultXml,
    schema: getSchemaFromDoc(resultDoc),
  };

  //TODO: Als XML niet geformatteerd worden -> propere exception opbouwen met  resultDoc.all
}

function getSchemaFromDoc(doc) {
  try {
    return doc.documentElement.attributes["xsi:noNamespaceSchemaLocation"].value;
  } catch (err) {
    return '';
  }
}

// **************************** Status functions ******************************

function setStatus(text) {
  var str = "";
  try {
    str = chrome.i18n.getMessage("copiedToClipboard", [text]);
  } catch (err) {
    str = text + ' copied to clipboard';
  }

  var stat = document.getElementById('div-status');
  stat.innerHTML = str;
  stat.classList.add("list-group-item-success");
  stat.classList.remove("list-group-item-secondary");
}

// **************************** Settings functions ******************************

function toggleDisplay(elementId) {
  var lmnt = document.getElementById(elementId);

  if (lmnt.classList.contains("d-none"))
    lmnt.classList.remove("d-none");
  else
    lmnt.classList.add("d-none");
}

function setDisplay(elementId, value) {
  var lmnt = document.getElementById(elementId);

  if (value)
    lmnt.classList.remove("d-none");
  else
    lmnt.classList.add("d-none");
}
// **************************** Exceptions ******************************

function XmlParseException(message) {
  this.message = message;
  // Use V8's native method if available, otherwise fallback
  if ("captureStackTrace" in Error)
    Error.captureStackTrace(this, XmlParseException);
  else
    this.stack = (new Error()).stack;
}

XmlParseException.prototype = Object.create(Error.prototype);
XmlParseException.prototype.name = "XmlParseException";
XmlParseException.prototype.constructor = XmlParseException;

function XsdLoadException(message) {
  this.message = message;
  // Use V8's native method if available, otherwise fallback
  if ("captureStackTrace" in Error)
    Error.captureStackTrace(this, XsdLoadException);
  else
    this.stack = (new Error()).stack;
}

XsdLoadException.prototype = Object.create(Error.prototype);
XsdLoadException.prototype.name = "XsdLoadException";
XsdLoadException.prototype.constructor = XsdLoadException;

function XsdValidationException(message) {
  this.message = message;
  // Use V8's native method if available, otherwise fallback
  if ("captureStackTrace" in Error)
    Error.captureStackTrace(this, XsdValidationException);
  else
    this.stack = (new Error()).stack;
}

XsdValidationException.prototype = Object.create(Error.prototype);
XsdValidationException.prototype.name = "XsdValidationException";
XsdValidationException.prototype.constructor = XsdValidationException;


// **************************** Helper functions ******************************