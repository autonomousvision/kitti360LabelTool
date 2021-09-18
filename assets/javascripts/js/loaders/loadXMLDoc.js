function loadXMLDoc(filename)
{
	var xhttp;
	if (window.XMLHttpRequest) {
	 	xhttp=new XMLHttpRequest();
	}
	else // code for IE5 and IE6
	{
	  	xhttp=new ActiveXObject("Microsoft.XMLDOM");
	}
	

	xhttp.open("GET", filename, false);
	xhttp.setRequestHeader("Cache-Control", "no-cache");
	xhttp.send();
	//alert(xhttp.status);
	return {status: xhttp.status, data: xhttp.responseXML};
}
