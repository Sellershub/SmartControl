/*
*/

function nxaconsolelog(msg)
{
	//console.log(""+Date.now()+" : " + msg);
}

function changeimage(selector, imageurl) {
    $(selector).attr("src", imageurl);
}

function PageControl() {
    this.loading = false; // set loading to true whenever you reload the page or load a different page
}
PageControl.prototype.reloadPage = function() {
    if(!this.loading) {
        this.loading = true;
        window.location.reload();
    }
};
PageControl.prototype.loadPage = function(url) {
    if(!this.loading) {
        this.loading = true;
        window.location.href = url;
    }
};
var pageControl = new PageControl();

var nxaWebDataChannel = {"Channel":false,"Response":false }; // the data channel a websocket if available

var controlstates = {}; // create a new collection
var alarmClocksPlaying = {}; // create the alarmclocks which are playing
var alarmHandlerInstalled = false;

var standbyHandlerInstalled = false;

function onPageUnload(){
}

function emptyEventHandler(event)
{
	return false;
}

function clearContolStateCollection(){
    controlstates = {};
}

function getControlState(id){
    return controlstates[id];
}

function startAlarm(selector){
	try{
		if(!selector)return;
		nwal_playSound(selector,true);
		alarmClocksPlaying[selector] = selector;
		InstallAlarmhandler();
	}catch(e){
		//nxa_alert(e);
	}
}


function stopAlarm(selector){
	try{
		if(!selector)return;

		try{
			nwal_stopSound(selector);
		}
		catch(ex)
		{
			//nxa_alert(ex);
		}
		alarmClocksPlaying[selector] = undefined;
	}catch(e){
		//nxa_alert(e);
	}
}

function alarmHandler(){
	alarmHandlerInstalled = false;
	try{
		sendComand("allAlarmsTimeReset","");
		alarmClocksPlaying.forEach(stopAlarm);
	}catch(e){
		//nxa_alert(e);
	}
}

function InstallAlarmhandler(){
	if(!alarmHandlerInstalled)
	{
		$("#page").one("click",function(){alarmHandler();});
		alarmHandlerInstalled = true;
	}
}


var lastInterationTime = new Date();

function standbyHandler(){
	try{
		lastInterationTime = new Date();
		if(standbySettings)
		{
			standbySettings.shortTimeout = -1;
			if(standbySettings.isActive)
			{
				sendComand("standbyend",{pageid:-1});
				standbySettings.isActive = false;
			}
		}
	}catch(e){
		//nxa_alert(e);
	}
}

function InstallStandyHandler(){
	if(!standbyHandlerInstalled)
	{
		$("#page").on("click touchstart touchend mousemove mousedown mouseup mouseout",function(){standbyHandler();});
		standbyHandlerInstalled = true;
	}
}
function workerCycle()
{
	try
	{
		// var standbySettings = {pageid: @@TIMEOUT_PAGEDID@@ , timeout:   @@TIMEOUT_TIMEMS@@};
		if(standbySettings && standbySettings.pageid && standbySettings.timeout)
		{
			if(standbySettings.pageid>0)
			{
				 // check the timeouts
			 	var diff = new Date().getTime() - lastInterationTime.getTime();
				if ( (standbySettings.shortTimeout > 0 && diff > standbySettings.shortTimeout) || (standbySettings.timeout > 0 && diff > standbySettings.timeout) )
				{
					sendComand("gotopage",{pageid:standbySettings.pageid, opts: standbySettings.opts}); // standbySettings.opts is passed to make sure the server gets informed about "[sbtr]"
				}
			}
		}
	}
	catch(e)
	{

	}
	setTimeout("workerCycle()",2000);
}

function getGroupIDClass(inObj,prefix,newPrefix)
{
	if(!inObj)return false;
	if(!prefix)
	{
		prefix = "group";
	}
	if(!newPrefix)
	{
		newPrefix = prefix;
	}
	var classString = inObj.attr("class");
	if(classString){
		var classes = classString.split(" ");
		for (var clsIdx in classes)
		{
			var cls = classes[clsIdx];
			var preLen = prefix.length;
			if(cls.startsWith(prefix) && cls.length>preLen)
			{
				var grpcls = newPrefix + cls.substr(preLen);
				return grpcls;
			}
		}
	}
	return false;
}


function InstallPopUpHandler()
{
	$("#page").on("click touchstart",
		function(ev){
			try{
				var tgt = ev.target;
				var tgtId = tgt.id;
				var tgtObj = $(tgt);
				var saveClasses  = [];
				try{
					var letOpen = tgtObj;
					if(!letOpen.hasClass("popupopen")){
						var fXO = letOpen.closest(".popupopen");
						letOpen = fXO;
					}
    				var forceClass = getGroupIDClass(letOpen,"popopen","group");
    				if(forceClass)
    				{
    					saveClasses.push("."+forceClass);
    				}
				}
				catch(exx){
					//nxa_alert("popuphandler 1 : " + exx);
				}
				//default handling
				if(!tgtObj.hasClass("popup")){
					var pXO = tgtObj.closest(".popup");
					tgtObj = pXO;
				}
				var groupClass = getGroupIDClass(tgtObj,"group");
				if(groupClass)
				{
   					saveClasses.push("."+groupClass);
				}
				if(saveClasses.length > 0){
					var saveClsStr = saveClasses.join(", ")
					$(".popup_ac:not("+saveClsStr+")").css('visibility', 'hidden');
					try{
					   $(".popup_ac:not("+saveClsStr+")").removeClass("popup_active");
					}
					catch(exx){
					}
				}
				else{
					$(".popup_ac").css('visibility', 'hidden');
					try{
					   $(".popup_ac").removeClass("popup_active");
					}
					catch(exx){
					}
				}
			}
			catch(ex){
				//nxa_alert("popuphandler 2 : " + exx);
			}

		}
	);
}


function cbSelectItem(sendid)
{
	try
	{
		var lblSelector = '#lbl-tbl-'+sendid;
		var txtSel = "#lbl-txt-"+sendid;
		var cbSelector = '#lbl-cb-'+sendid;
		var cbx = $(cbSelector).get(0);
		if(cbx == null || cbx.selectedIndex < 0)
		{
			return;
		}
		var slval = cbx.options[cbx.selectedIndex].value;
		$(txtSel).text(cbx.options[cbx.selectedIndex].text);
		$(cbSelector).hide();
		$(lblSelector).show();
		sendComand("ctrlvalchange",{id:sendid,val:slval});
	}
	catch(e)
	{
		//nxa_alert("cbSelectItem: id: " + sendid + " , Exception: " + e);
	}
}

function cbShow(sendid,rows)
{
	try
	{
		var lblSelector = '#lbl-tbl-'+sendid;
		var cbSelector = '#lbl-cb-'+sendid;
		$(lblSelector).hide();
		var cbx = $(cbSelector).get(0);
		if(cbx != null)
		{
			cbx.selectedIndex = -1;
		}
		$(cbSelector).attr('size',rows);
		$(cbSelector).show();
	}
	catch(e)
	{
		//nxa_alert("cbSelectItem: id: " + sendid  + "Exception: " + e);
	}
}




function setControlStateValue(id,valname,valdata){
    try{
        var elem = controlstates[id];
        if(elem)
        {
			elem[valname] = valdata;
		}
    }catch(e){
        //nxa_alert("setControlStateValue id: "+ id+" , exception: "+ e);
    }
}

var undef_timespan = 5000; //5sec undefined time
var undef_starttimeout = 1000; // 1 sec timeout

function addControlToStateCollection(id,type,data){
    try{
        controlstates[id] = data();
    }catch(e){
        //nxa_alert("addControlToStateCollection : "+ e +" , id: " + id + ", data: " +data);
    }
}

// Numberinput controls
var nmi_actual_command;
var nmi_actual_mode = 1; // 1 = numerical, 2 = alpha nummeric mode , 3 = datetime mode
var nmidisplayed = false;

function setInputFormDynamicMode(id,nmimode)
{
	try
	{
		$("#"+id).data("nmi_mode",nmimode);
	}
	catch(exx)
	{
	}
}

function showNumberInputForm(startvalue,mode,nmicommand){
    if(!nmidisplayed){
        nmi_actual_mode = mode;
        nmi_actual_command = nmicommand;
        if(nmi_actual_command.id)
        {
        	try
        	{

        		var dynMode = $("#"+nmi_actual_command.id).data("nmi_mode");
				if(dynMode)
				{
					nmi_actual_mode = parseInt(dynMode);
				}
        	}
        	catch(exx)
        	{
        	}
        }
		
		$( "#nmi_inputbox" ).attr( "type", "input" );
		if (nmi_actual_command.type)
		{
			if (nmi_actual_command.type == "password")
			{
				$( "#nmi_inputbox" ).attr( "type", "password" );
				startvalue="";
			}
		}

        try{
			$("#nmi_incrt_nummeric").hide();
		}
		catch(exx){}
        try{
			$("#nmi_incrt_alpha").hide();
		}
		catch(exx){}

		$(".nmi_headertext").text("Please enter value");
		$(".nmi_vin_sec").show(); // show the input section
		$(".nmi_conf_sec").hide(); // hide the info section


		switch(nmi_actual_mode)
		{
			case 4: // info window
			{
				try{
				$(".nmi_headertext").text("Please confirm");
				$(".nmi_vin_sec").hide(); // hide the input section
				$(".nmi_conftext").text(startvalue);
				$(".nmi_conf_sec").show(); // display the config section
				$("#nmi_incrt_alpha").show();
				}
				catch(txtxt)
				{
				}
				break;
			}
			case 2: // alpha
			{
				try{
					$("#nmi_incrt_alpha").show();
				}
				catch(exx){}
				break;
			}
			default: // everything else
			{
				try{
					$("#nmi_incrt_nummeric").show();
				}
				catch(exx){}
			}
		}



        $(".nmi_control").show();
        try{
			$('.nmi_innercontrol').css({top:'50%',left:'50%',margin:'-'+($('.nmi_innercontrol').height() / 2)+'px 0 0 -'+($('.nmi_innercontrol').width() / 2)+'px'});
		}
        catch(err){}
        try{
			$(".nmi_innercontrol").center();
		}
        catch(err){}
        $("#nmi_inputbox").focus();
        $("#nmi_inputbox").val(startvalue);
        nmidisplayed=true;
    }
}

function hideNumberInputForm(sendCommand){
    try{
        $(".nmi_control").hide();
    } catch(e){}

    try{
		$("#nmi_incrt_nummeric").hide();
	}catch(exx){}

    try{
		$("#nmi_incrt_alpha").hide();
	}catch(exx){}

    try {
        if(sendCommand){
            nmi_actual_command.codevalue = encodeURIComponent($("#nmi_inputbox").val()); //store the codevalue
            sendComand(nmi_actual_command.cmd,nmi_actual_command);
        }
    } catch(e){
    }
    nmidisplayed=false;
    nmi_actual_command = null;
}

function isNum(val){
    try{
        if(val=="0" || val=="1" || val=="2" || val=="3" || val=="4" || val=="5" || val=="6" || val=="7" || val=="8" || val=="9"){
            return true;
        }
    } catch(e){
    }
    return false;
}

// numeric control methods
function informBtnClick(value,isDecSep){
    if(!nmidisplayed)return;
    var val =  $("#nmi_inputbox").val();
    var isnum = false;
    var cmd = "";
    var num = 0.0;

    try{
        isnum = isNum(value);
    }catch(e){
        cmd = value;
    }
    if(isnum){
       val = val + value;
    }
    else{
	  cmd = value;
      if(isDecSep){
        if(val.indexOf(cmd) == -1){
            val = val + cmd;
        }
      }else if(cmd=="+-"){
        if(nmi_actual_mode == 3){ // replace am/pm designator
            if(val.indexOf("PM") > -1){
                val = val.replace(/PM/,"AM");
            }else{
                val = val.replace(/AM/,"PM");
            }
        }
        if(val.substr(0,1) == "-"){ //search for negative value pattern
            val = val.replace(/-/,""); // remove first -
        }else{
            val = "-"+val;
        }
      }
    }
    //write the value back to the display
    $("#nmi_inputbox").val(val);
}

function informBtnOkClick(){
    if(!nmidisplayed)return;
    hideNumberInputForm(true);
}
function informBtnCancelClick(){
   if(!nmidisplayed)return;
   hideNumberInputForm(false);
}

function informBtnBackClick(){
    if(!nmidisplayed)return;
    var val =  $("#nmi_inputbox").val();
    var len = val.length;
    if(len > 0){
        val = val.substr(0,len-1);
    }
    $("#nmi_inputbox").val(val);
}

// this is the page timer method which runs in the background and handles some ui interaction things
var lastCheckTime = new Date();
function pageTimer() {
    try{
		if(nxaWebDataChannel.Response)
		{
			lastCheckTime = new Date();
			if(nxaWebDataChannel.Channel)
			{
				nxaWebDataChannel.Channel.send("touch");
			}
		}
		else
		{
			var diff = new Date().getTime() - lastCheckTime.getTime();
			if( diff > 60000){
                pageControl.reloadPage();
			}
		}
	} catch(ex){
    }
    setTimeout("pageTimer()", 10000); // 10 sec timer
}

function datetimeDisplayLoop(selector,attribute,formatstring){
    try{
        var dts = new Date().format(formatstring);
        var attrs = {Selector:selector,Attr:attribute,Value:dts};
        setAttr(attrs);
        var functioncall = "datetimeDisplayLoop(\""+selector+"\",\""+ attribute+ "\",\"" + formatstring+"\")";
        setTimeout(functioncall, 900);
    }catch(e){
    }
}

function gotoPage(newpagepath,newpageparams){
	if(newpagepath == "login.html"){
		newpageparams = "";
	}else{
		newpageparams = (newpageparams)?newpageparams+"&sesstok=":"?sesstok=";
		newpageparams += cmdtoken;
	}
    pageControl.loadPage(newpagepath+newpageparams);
}

function serverEventChanged(wid, type) {
    sendComand("servereventchanged", wid + ":" + type);
}

function setLocation(loc){
    pageControl.loadPage(loc);
}

function hideLayer(selector) {
	try
	{
	    $(selector).addClass("layer_off");
    }
	catch(ex){
	}
	try{
		$(selector).hide();
    }
	catch(ex){
	}
}

function showLayer(selector) {
	try
	{
	    $(selector).removeClass("layer_off");
    }
	catch(ex){
	}
	try{
		$(selector).show();
    }
	catch(ex){
	}
}

function hidePopup(selector) {
	try{
	    $(selector).css('visibility', 'hidden');
	}
	catch(ex){
	}
	try{
	   $(selector).removeClass("popup_active");
	}
	catch(ex){
	}
}

function showPopup(selector) {
	try{
		$(selector).css('visibility', 'visible');
    }
	catch(ex){
	}
	try{
	   $(selector).addClass("popup_active");
	}
	catch(ex){
	}
}


function showSelector(selector)
{
	$(selector).show();
}

function hideSelector(selector)
{
	$(selector).hide();
}

function gotoBack() {
    sendComand("gotoback","");
}

function gotoForward() {
    sendComand("gotoforward","");
}

function interpretJS(jsSnippet) {
	try{
		eval(jsSnippet);
    }
	catch(ex)
	{
		//nxa_alert("interpret : '" + jsSnippet + "' exception: " +   ex);
	}
}

function stringfyParameters(data){
    var str = JSON.stringify(data);
    return str;
}

function sendComand(cmdname,data){
    console.log('sendCommand commandurl: ', commandurl, ' data: ', {cmd:cmdname,cmddata:data,sesstok:cmdtoken});
    $.ajax({type:"GET",async:true,cache:false, url:commandurl,data:{cmd:cmdname,cmddata:data,sesstok:cmdtoken},success:function(data){ },error:function(XmlHttpRequest,status,error){   }});
}

function sendComandInSync(cmdname,data){
    console.log('sendComandInSync commandurl: ', commandurl, ' data: ', {cmd:cmdname,cmddata:data,sesstok:cmdtoken});
    $.ajax({type:"GET",async:false,cache:false, url:commandurl,data:{cmd:cmdname,cmddata:data,sesstok:cmdtoken},success:function(data){ },error:function(XmlHttpRequest,status,error){   }});
}

function setAttr(jqA) {
	try {
	    if (jqA.Attr == "text"){
	        $(jqA.Selector).text(jqA.Value);
	    } else if (jqA.Attr == "val"){
	        $(jqA.Selector).val(jqA.Value);
	    } else if (jqA.Attr == "html"){
	        $(jqA.Selector).html(jqA.Value);
	    } else{
	        $(jqA.Selector).attr(jqA.Attr, jqA.Value);
	    }
	}
	catch(ex) {
		//nxa_alert("setAttr : " + ex);
	}
}

function processGlobalAjaxData(data) {
    //check for ajaxpolling request
	try {

 		var pData =data;
	if (pData && pData.length > 0){
	        var inObject = eval('(' + pData + ')'); // evaluate the response text
			inObject.SelectorValues.forEach(setAttr);
			inObject.JavaScript.forEach(interpretJS);
		}
	}
	catch (ex) {
		nxa_alert("processGlobalAjaxData ex: " + ex);
	}
}

function getDataChannelUrl()
{
	var loc = window.location;
	var uri = loc.href;
	uri = uri.replace(/\/index.html(?!.*\/index.html)/,"/webs.ws");
	uri = uri.replace(/^https:/,"wss:");
	uri = uri.replace(/^http:/,"ws:");
	return uri;
}
function setupDataChannel()
{
	// reset the vars!
	nxaWebDataChannel.Response = false;
	nxaWebDataChannel.Channel = false;
	nxaconsolelog("setupDataChannel START : Time:  " + Date.now());

	try
	{
		if ("WebSocket" in window)
		{
			var uri = getDataChannelUrl();
			// use web socket
			nxaWebDataChannel.Channel = new WebSocket(uri);
			if(nxaWebDataChannel.Channel && nxaWebDataChannel.Channel.url)
			{
				nxaWebDataChannel.Channel.onopen = function()
				{
					nxaconsolelog("websocket OPEN : Time:  " + Date.now());
					// Web Socket is connected, send data using send()
					nxaWebDataChannel.Channel.send("ihsu");
				};
				nxaWebDataChannel.Channel.onmessage = function (evt)
				{
					try{
						var rcvData = evt.data;
						nxaWebDataChannel.Response = true;
						if(rcvData === "ihsu_ak")
						{
							nxaWebDataChannel.Response = true;
							nxaconsolelog("websocket ACK: Time:  " + Date.now());
						}
						else
						{
							processGlobalAjaxData(rcvData);
						}
					}
					catch(err)
					{
						nxaconsolelog("websocket onmessage ex: "+err);
					}
				};
				nxaWebDataChannel.Channel.onclose = function()
				{
					if(!nxaWebDataChannel.Response)
					{
						globalAjaxRequest(); // use fallback so if its not working
					}
					else
					{
						setTimeout("setupDataChannel()",1000); // setup the data channel in 1 sec
					}
					nxaWebDataChannel.Channel = false;
					nxaWebDataChannel.Response = false;

				};
				nxaWebDataChannel.Channel.onerror = function()
				{
					nxaconsolelog("websocket error");
				};
			}
			else{
				nxaconsolelog("reseting broken websocket.");
				nxaWebDataChannel.Response = false;
				nxaWebDataChannel.Channel = false;
			}
		}
		else
		{
			nxaconsolelog("websocket not available");
		}
	}
	catch(ex)
	{
		nxaconsolelog("websocket setup ex: " + ex);
		nxaWebDataChannel.Response = false;
		nxaWebDataChannel.Channel = false;

	}
	if(!nxaWebDataChannel.Channel)
	{
		nxaconsolelog("websocket use fallback");
		nxaWebDataChannel.Response = false;
		globalAjaxRequest(); // use fallback
	}
}

function globalAjaxRequest() {
    //prepare the global status request
	$.ajax({type:"GET",async:true, cache:false, url:statusurl,data:{cmd:"globalupdate",cmddata:{pid:pageid},sesstok:cmdtoken},success:function(data){ lastCheckTime = new Date(); processGlobalAjaxData(data); setTimeout("globalAjaxRequest()", 10); },error:function(XmlHttpRequest,status,error){  lastCheckTime = new Date(); setTimeout("globalAjaxRequest()",1000);  }});
}

function stripSliderId(fullid){
    var idx = fullid.indexOf("-");
    if (idx > -1){
        return  fullid.substring(idx+1);
    }
    return fullid;
}

function setRGBSColor(sel,color)
{
	try
	{
		$(sel).get(0).farbtastic.setColor(color);
	}
	catch(ex)
	{
		//nxa_alert("setRGBSColor sel:" + sel +  " , color: "+col + " , Exception: " + ex );
	}
}

function sendObjectBackColor(sel,sendid)
{
	try{
		var slval = $(sel).css("backgroundColor");
		sendComand("ctrlvalchange",{id:sendid,val:slval});
	}catch(ex){
		//nxa_alert("sendObjectValue: "+sel + " , ID: " + sendid + ", ex: " + ex);
	}
}

function nxaObjectClick(tgt){
	try{
    	var laid = tgt.currentTarget.id;
    	if(!laid){return;}
    	sendComand("obj_click",{id:laid});
	}catch(ex){
    	nxa_alert("nxaObjectClick: "+tgt + " , ex: " + ex);
  	}
}

function sliderValueChange(ex){
  try{
    var id = ex.currentTarget.id;
    if(!id){return;}

    var idx = "#"+id;
    var slval = $(idx).slider("option","value");
    var sid = stripSliderId(id);
    sendComand("slidervalchange",{id:sid,val:slval});
  }catch(ex){
      //nxa_alert("slvc: "+id + " , ex: " + ex);
  }
}

function logOff(){
  try{
    sendComand("logoff",{nop:"nop"});
	return "ok";
  }catch(ex){
  }
  return "nok";
}

function removeItemLock(selector){
	$(selector).removeClass("itmlocked");
}

function addItemLock(selector){
	if($(selector).hasClass("itmlocked"))return;
	$(selector).addClass("itmlocked");
}

function buttonMouseDown(ex,isid){
	var eid = (isid)?ex:ex.currentTarget.id;
	internalButtonDown(eid);
}

function buttonTouchDown(eid,event){
	if( !$('#'+eid).hasClass("nxa_btn_ev") )return;
	internalButtonDown(eid);
}

function internalButtonDown(cid){

	if(!cid) {
		return;
	}

    var ctl = getControlState(cid); //get control
    if(!ctl) {
		return;
	}

	if(ctl.passive) {
		return;
	}

	try{
		if(!cid){return;}
		var ctl = getControlState(cid); //get control
		if(!ctl){return;}
		if($('#'+cid).hasClass("itmlocked"))return;
		var isPressed= $('#'+cid).hasClass("itmpressed");
		if(isPressed){
			return;
		}
		$('#'+cid).addClass("itmpressed");

		if(ctl.btndownflip){
			ctl.state = "down";
			changeimage(ctl.picclass,ctl.picdown);
		}
		sendComand("buttonmousedown",{id:cid});
	}catch(ex){
	   //nxa_alert("internalButtonDown: "+cid + " , ex: " + ex);
	}
}

function buttonMouseUp(ex,isid){
	var eid = (isid)?ex:ex.currentTarget.id;
	internalButtonUp(eid);
}

function buttonTouchUp(eid,event){
 	if( !$('#'+eid).hasClass("nxa_btn_ev") )return;
	internalButtonUp(eid);
}

function internalButtonUp(cid){
	try{

		if(!cid){
			return;
		}

		if($('#'+cid).hasClass("itmlocked"))return;

		var isPressed= $('#'+cid).hasClass("itmpressed");
		if(!isPressed){
			return
		}

		$('#'+cid).removeClass("itmpressed");
		var ctl = getControlState(cid); //get control
		if(!ctl){
			return;
		}

		var oldstate = null;
		var cf = ctl.cf;
		var cm = ctl.cm;
		var cl = ctl.cl;
		if(ctl.passive){
			return;
		}

		if(!cl){
			if(cf == 0){
			  if(cm != 1){
				if(cm == 2){
					oldstate = ctl.state;
					if(ctl.state === "up"){
						ctl.state = "down";
						changeimage(ctl.picclass,ctl.picdown);
					} else{
						ctl.state = "up";
						changeimage(ctl.picclass,ctl.picup);
					}
				} else{
					ctl.state = "up";
					changeimage(ctl.picclass,ctl.picup);
				}
			  }
			}
			else{
				if(cf!=12){
					ctl.state = "up";
					changeimage(ctl.picclass,ctl.picup);
				}
			}
		}

		var smuc = ctl.smuc;
		if(smuc){
			sendComand("buttonmouseup",{id:cid});
			var lamu = ctl.lamu;
			if(!cl && lamu){
				addItemLock('#'+cid);
			}
		}
	} catch(ex){
	  //nxa_alert("internalButtonUp: "+cid + " , ex: " + ex);
	}
}



function setButtonState(cid,cstate,remLocks)
{
	try{
	var ctl = getControlState(cid); //get control
    if(!ctl){
		return;
	}
	if(cstate == "undef"){
		if(ctl.picundef){
			changeimage(ctl.picclass,ctl.picundef);
		}
		return;
	}
	else{
		if(cstate == "up"){
			ctl.state = "up";
			changeimage(ctl.picclass,ctl.picup);
		}
		else{
			ctl.state = "down";
			changeimage(ctl.picclass,ctl.picdown);
		}
		try{
			var csl = "#"+cid;
			if(remLocks){
				if (remLocks == "l"){
					$(csl).removeClass("itmlocked");
				}
				else if (remLocks == "lp"){
					$(csl).removeClass("itmlocked");
					$(csl).removeClass("itmpressed");
				}
			}
		}
		catch(e){
			//nxa_alert("setButtonState e: "+e);
		}
	}
	}
	catch(ex){
		//nxa_alert("setButtonState e: "+ex);
	}
}

function adjustScaler(w,h){
    if (GLOBAL_VARIABLES && GLOBAL_VARIABLES.ADJUST_SCALER == false) {
        return; // dont adjust, fixes zoom problem bug on android devices
    }
	sendComandInSync("setclientparams",{clw:w,clh:h});
}
function adjustScalerAsync(w,h){
    if (GLOBAL_VARIABLES && GLOBAL_VARIABLES.ADJUST_SCALER == false) {
        return; // dont adjust, fixes zoom problem bug on android devices
    }
	sendComand("setclientparams",{clw:w,clh:h});
}

function scaleCycle(){
	try{
		try{
			pageCheck(pageid);
		}catch(exxe){
		}

		var w = window.innerWidth;
		var h = window.innerHeight;
		try{
			if(document.documentElement){
				w = w || document.documentElement.clientWidth;
				h = h || document.documentElement.clientHeight;
			}
		}catch(e){
		}
		try{
				w = w || document.body.clientWidth;
				h = h || document.body.clientHeight;
		}catch(e){
		}
		try{
			adjustScalerAsync(w,h);
		}catch(exxxx){
		}
	}catch(ex){
	}
	setTimeout("scaleCycle()",5000);
}

function pageCheck(pdi){
	sendComand("setclientparams",{pid:pdi});
}

function docready(pageselector) {
	try
	{
		setupDataChannel();
	}
	catch(setex)
	{
		nxaconsolelog("channel ex: " + setex);
	}
}

function reloadActualWindow(){
    pageControl.reloadPage();
}

function cleanNumberField(textfield){

}
function nxadocunload()
{
	if(nxaWebDataChannel.Channel && nxaWebDataChannel.Channel.url)
	{
		nxaWebDataChannel.Channel.close();
		nxaWebDataChannel.Channel = false;
	}

}
