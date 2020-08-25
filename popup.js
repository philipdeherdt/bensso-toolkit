document.addEventListener('DOMContentLoaded', function() {

  document.getElementById("btn_format").addEventListener('click',function() { doPrettify(); } , false);

}, false);

// **************************** Core functionality *****************************

function doPrettify() {
  var input = document.getElementById('txt_inputxml');
  var output = document.getElementById('txt_outputxml');
  var xsd = document.getElementById('txt_outputxsd');
  var validation = document.getElementById('txt_validation');

  result = prettify(clean(input.value));
  output.value = result.formatted;
  xsd.value = getXsdPayload(result.schema)??"Try again later"; //Would be better to fix some async stuff I guess

  //create an object
  var Module = {
      xml: output.value,
      schema: xsd.value,
			arguments: ["--noout", "--schema", "file.xsd", "file.xml"]
    };

  validation.value = validateXML(Module);
}

function getUrl(filename){
  var url = "https://www.socialsecurity.be/docu_xml/";
  var rgx = (/([A-Z a-z]*)(\d*)_(\d*)/g).exec(filename)

  if(rgx[1]=="ZIMA"){
    url = url.concat("drs/inami/");
    if(rgx[2]=="001") url = url.concat("scen1/");
    if(rgx[2]=="002") url = url.concat("scen2/");
    if(rgx[2]=="003") url = url.concat("scen3/");
    if(rgx[2]=="005") url = url.concat("scen5/");
    if(rgx[2]=="006") url = url.concat("scen6/");
  }
  else if(rgx[1]=="AADD"){url = url.concat("drs/inami/scen7/");}
  else if(rgx[1]=="WECH"){
    url = url.concat("drs/onem/");
    if(rgx[2]=="001") url = url.concat("scen1/");
    if(rgx[2]=="002") url = url.concat("scen2/");
    if(rgx[2]=="003") url = url.concat("scen3/");
    if(rgx[2]=="005") url = url.concat("scen5/");
    if(rgx[2]=="006") url = url.concat("scen6/");
    if(rgx[2]=="007") url = url.concat("scen7/");
    if(rgx[2]=="008") url = url.concat("scen8/");
    if(rgx[2]=="009") url = url.concat("scen9/");
    if(rgx[2]=="010") url = url.concat("scen10/");
    if(rgx[2]=="011") url = url.concat("scen11/");
  }
  else if(rgx[1]=="IDFLUX"){url = url.concat("idflux/");}
  else if(rgx[1]=="ACRF"){url = url.concat("acr/");}
  else if(rgx[1]=="NOTIFICATION"){url = url.concat("noti/");}
  else if(rgx[1]=="DmfAOriginal"){url = url.concat("dmfa/");}
  else if(rgx[1]=="DmfAUpdate"){url = url.concat("dmfaupdate/");}
  else if(rgx[1]=="DmfAUpdateNotification"){url = url.concat("dmfaupdatenotification/");}
  else if(rgx[1]=="BewareNotification"){url = url.concat("beware/");}
  else if(rgx[1]=="DmfAConsultationRequest"){url = url.concat("dmfarequest/");}
  else if(rgx[1]=="DmfAConsultationAnswer"){url = url.concat("dmfaanswer/");}
  else if(rgx[1]=="DmfAPID"){url = url.concat("dmfapid/");}
  else if(rgx[1]=="GenericXmlDocument"){url = url.concat("genericxml/");}
  else if(rgx[1]=="ReductionConsultationAnswer"){url = url.concat("redcoanswer/");}
  else if(rgx[1]=="EcoUnemploymentDaysConsultAnswer"){url = url.concat("ecounemploymentdaysconsultanswer/");}

  return url.concat(filename);
}

function getXsdPayload(filename){
  var localPayload = localStorage.getItem(filename);
  if (localPayload!=null) return localPayload;

  const proxyurl = "https://cors-anywhere.herokuapp.com/";
  var url = getUrl(filename);
  fetch(proxyurl + url)
  .then(response => response.text())
  .then(contents => localStorage.setItem(filename, contents))
  .catch(() => console.log("Can’t access " + url + " response. Blocked by browser?"))


   return localStorage.getItem(filename);
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
    //return resultXml;
    return {
        formatted: resultXml,
        schema: getSchemaFromDoc(resultDoc),
    };
}

function getSchemaFromDoc(doc){
  try {
    return doc.documentElement.attributes["xsi:noNamespaceSchemaLocation"].value;
  }
  catch(err) {
    return '';
  }
}

// **************************** Status functions ******************************

function setStatus(text) {
  var str = "";
  try {
    str = chrome.i18n.getMessage("copiedToClipboard",[text]);
  }
  catch(err) {
    str = text + ' copied to clipboard';
  }

  var stat = document.getElementById('div-status');
	stat.innerHTML = str;
	stat.classList.add("list-group-item-success");
	stat.classList.remove("list-group-item-secondary");
}

// **************************** Settings functions ******************************

function toggleDisplay(elementId){
  var lmnt = document.getElementById(elementId);

  if (lmnt.classList.contains("d-none"))
    lmnt.classList.remove("d-none");
  else
    lmnt.classList.add("d-none");
}

// **************************** Setup functions ******************************


// **************************** Helper functions ******************************
