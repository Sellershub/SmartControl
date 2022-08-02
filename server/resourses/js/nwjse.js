/*
*  Javascript extensions
*  Needed by all NETx javascript libs
*
*  Depends: jQuery, underscore , json2 
* */

// padding methods
String.prototype.padZero= function(len, c){
    var s= '', c= c || '0', len= (len || 2)-this.length;
    while(s.length<len) s+= c;
    return s+this;
}

Number.prototype.padZero= function(len, c){
    return String(this).padZero(len,c);
}

// add the indexOf method if its not existing in the prototype. IE < 9
if (!Array.prototype.indexOf)
{
    Array.prototype.indexOf = function(elt , from)
    {
        _.indexOf(this,elt); // use the underscore lib implementation
    };
}

// add array for each if not existing in the prototype. IE < 9
if(!Array.prototype.forEach)
{
    Array.prototype.forEach = function(meth)
    {
        for (var i = 0; i < this.length; i++) {
            meth(this[i]);
        }
    }
}

// array extension class
function ArrayExtension(array) {
    this.__array__ = array;
}

// array extension prototype
(function (arrayex) {

    arrayex.remove = function(elt) {
        return this.__array__.splice( this.__array__.indexOf(elt));
    }

    arrayex.add = function(elt,allowDup) {
        if(!allowDup)
        {
            if( this.__array__.indexOf(elt)>0)
            {
                return  this.__array__;
            }
        }
        this.__array__.push(elt);
        return  this.__array__;
    }

    arrayex.getArray = function() {
        return this.__array__;
    }

})(ArrayExtension.prototype);


// datetime extensions
if(!Date.prototype.diffInMilliSeconds)
{
	Date.prototype.diffInMilliSeconds = function(other)
	{
		var myOffset = this.getTimezoneOffset()*60*1000;
		var otherOffset = other.getTimezoneOffset()*60*1000;
		var myTS = this.getTime() - myOffset;
		var otherTS = other.getTime() - otherOffset;	
		return myTS - otherTS;	
	}
}

if(!Date.prototype.diffInSeconds)
{
	Date.prototype.diffInSeconds = function(other)
	{
		return this.diffInMilliSeconds(other)/1000;
	}
}

if (typeof String.prototype.startsWith != 'function') {
    String.prototype.startsWith = function (str){
        return this.slice(0, str.length) === str;
    };
}
if (typeof String.prototype.endsWith != 'function') {
    String.prototype.endsWith = function (str){
        return this.slice(-str.length) === str;
    };
}

//// EXTENSIONS END
// add event source methods
var nxa_usingMouse = false;
var nxa_usingTouch = false;

function nxa_touchEvent(context, event,tgt,stopProp)
{
    // prefer touch
    nxa_usingTouch = true;
    nxa_usingMouse = false;
    if(stopProp){
        event.stopPropagation();
        event.preventDefault();
    }
    if(context){
        if(context.id != ""){
            tgt(context.id,event);
        }
    }
    else
    {
        tgt(event);        
    }

}

function nxa_mouseEvent(context, event,tgt)
{
    if(!nxa_usingTouch)
    {
        nxa_usingMouse = true;
     //   event.stopPropagation();
    //    event.preventDefault();
        tgt(event);        
    }
}

// translation funtion
function nxa_tt(txt,options)
{
    try{
        if(txt && i18n)
        {
            var ttA = false;
            var key = txt;
            if(options)
            {
                if(options.i18n)
                {
                    ttA = options.i18n;
                }
            }
            if (!ttA)
            {
                ttA = i18n.nxaglobals;
            }
            if(ttA && ttA[key])
            {
                return ttA[key];
            }
        }
    }
    catch(ex)
    {}
    return txt;
}


// alert handling
function nxa_alert(msg,options)
{
    try{
        if( $("#nxa_alert_container").length<1)
        {
			// get localized text
			var txtalert = getI18Text("titlealert") || "Alert!";
			var txt = '<div id="nxa_alert_container" style="display:none;" title="' + txtalert + '"></div>';
            // create alert container
            $('body').prepend(txt);          
        }
    }
    catch(ex)
    {
        alert("create err: "+ex);
    }
    try{
        try{
            var content = "<p>" + ((msg)?nxa_tt(msg):"") + "</p>";
            var title = nxa_tt(getI18Text("titlealert") || "Alert!");
            if(options)
            {
                if(options.title)
                {
                    title = options.title;
                }
                if(options.content)
                {
                    content = options.content;
                }
            }
            $("#nxa_alert_container").empty().append(content).attr("title",nxa_tt(title));
        }
        catch(exxx)
        {}
        var opts = {
            modal: true,
            buttons: {} 
        };

        // add translated button
        opts.buttons[nxa_tt("Ok")] = function() { 
		    $( this ).dialog( "close" ); 
		};

        //display the message
        $( "#nxa_alert_container" ).dialog(opts);
    }
    catch(ex)
    {
        alert(msg + " , err: "+ex);
    }
}

// confirmation dialog
function nxa_confirm(options)
{
	 try{
        if( $("#nxa_confirm_container").length<1)
        {
            // create alert container
			var txtconfirm = getI18Text("titleconfirm") || "Confirm!";
			var txt = '<div id="nxa_confirm_container" style="display:none;" title="' + txtconfirm + '"></div>';
            $('body').prepend(txt);          
        }
    }
    catch(ex)
    {
        alert("create err: "+ex);
    }
    try{
        try{
            var content = "";
            var title = nxa_tt(getI18Text("titleconfirm") || "Confirm!");
           
           		if(options.msg)
           		{
           			content = "<p>" + nxa_tt(options.msg) + "</p>";
           		}
                if(options.title)
                {
                    title = options.title;
                }
                if(options.content)
                {
                    content = options.content;
                }
            
            $("#nxa_confirm_container").empty().append(content).attr("title",nxa_tt(title));
        }
        catch(exxx)
        {}

        //display the message
        $( "#nxa_confirm_container" ).dialog(options);
    }
    catch(ex)
    {
        alert(msg + " , err: "+ex);
    }
}


// Browser detect
var BrowserDetect = {
	init: function () {
		this.browserName = false;
		this.engineName = false;
		this.browserVersion = -1;
		this.engineVersion = -1;
		
		var product = this.searchCatalog(this.dataBrowser);
		var engine = this.searchCatalog(this.engineBrowser);
		
		if(product) {
			this.browserName = product.identity;
			this.browserVersion = this.searchVersion(navigator.userAgent,product) || this.searchVersion(navigator.appVersion,product);
		}
		if(engine) {
			this.engineName = engine.identity;
			this.engineVersion = this.searchVersion(navigator.userAgent,engine) || this.searchVersion(navigator.appVersion,engine);
		}
			
		var osCat = this.searchCatalog(this.dataOS);
		this.OS = (osCat) ? osCat.identity : "unknown OS";
	},
	searchCatalog: function (data) {
		for (var i=0;i<data.length;i++)	{
			var dataString = data[i].string;
			var dataProp = data[i].prop;
			if (dataString) {
				if (dataString.indexOf(data[i].subString) != -1)
					return data[i];
			}
			else if (dataProp)
				return data[i];
		}
		return false;
	},
	searchVersion: function (dataString,entry) {
		var searchString = entry.versionSearch || entry.subString;
		var index = dataString.indexOf(searchString);
		if (index < 0) return -1;
		return parseFloat(dataString.substring(index+searchString.length+1));
	},
	engineBrowser:[
		{
			string: navigator.userAgent,
			subString: "WebKit",
			identity: "webkit"
		}
	],
	dataBrowser: [
		{
			string: navigator.userAgent,
			subString: "Chrome",
			identity: "chrome"
		},		
		{
			prop: window.opera,
			identity: "opera",
			versionSearch: "Version"
		},		
		{
			string: navigator.userAgent,
			subString: "Firefox",
			identity: "firefox"
		},		
		{
			string: navigator.userAgent,
			subString: "MSIE",
			identity: "ie",
			versionSearch: "MSIE"
		},
        {
            string: navigator.userAgent,
            subString: "Trident",
            identity: "ie",
            versionSearch: "rv"
        }
	],
	dataOS : [
		{
			string: navigator.platform,
			subString: "Win",
			identity: "Windows"
		},
		{
			string: navigator.platform,
			subString: "Mac",
			identity: "Mac"
		},
		{
			string: navigator.userAgent,
			subString: "iPhone",
			identity: "iPhone/iPod"
	    },
		{
			string: navigator.platform,
			subString: "Linux",
			identity: "Linux"
		}
	]
};


function isBrowserSupported(){

	BrowserDetect.init();
	if (BrowserDetect.browserName)
	{
		if(BrowserDetect.browserName === "chrome" && BrowserDetect.browserVersion >= 22)
		{
			return true;
		}		
		if(BrowserDetect.browserName === "firefox" && BrowserDetect.browserVersion >= 17)
		{
			return true;
		}		
		if(BrowserDetect.browserName === "ie" && BrowserDetect.browserVersion >= 9)
		{
			return true;
		}		
		if(BrowserDetect.browserName === "opera" && BrowserDetect.browserVersion >= 12)
		{
			return true;
		}		
	}
	// check supported engines
	if(BrowserDetect.engineName)
	{
		if(BrowserDetect.engineVersion >= 500)
		{
			return true;
		}
	}
	return false;
}

/*
    Proto: Binder
    With this
*/
function Binder()
{
    this.name = "";
    this.value = nil;
    this.receivers = [];
    this.receiversEx = new ArrayExtension(this.receivers);
}

(function (nwbinder) {
    nwbinder.set = function(val)
    {
        this.value = val;
        this.receivers.forEach(this.secFire());
    };

    nwbinder.secFire = function(rec)
    {
        try
        {
            if(rec)rec(this.value);
        }
        catch(ex)
        {
            alert("Binder: " + this.name + " , secFire ex: " + ex);
        }
    };

    nwbinder.addRec = function(bdm)
    {

        this.receiversEx.add(bdm);
    };

    nwbinder.removeRec = function(bdm)
    {

        this.receiversEx.remove(bdm);
    };
})(Binder.prototype);

function getPickerStyleMode(selector)
{
    var stx = "m";
    try
    {
        var st = $(selector).attr("StyleSelector");
        if(st)
        {
            try{stx = $(st).val();}catch(ex){stx = "m";}
        }
    }
    catch(ex)
    {
        stx = "m";
    }
    return stx;
}

function createMonthPicker(selector,cbStyleSelector,cb)
{
    $(selector).attr('StyleSelector',cbStyleSelector);

    $(selector).datepicker({
        dateFormat: 'dd-mm-yy',
        changeMonth: true,
        changeYear: true,
        showButtonPanel: true,
        onClose: function(dateText, inst) {
            var mx = inst.selectedMonth;
            var yx = inst.selectedYear;
            var dx = inst.selectedDay;
            var rdt = new Date(yx,mx,dx);
            if(cb){
                cb(rdt);
            }
            else{
                var stx = getPickerStyleMode(this);
                // check values
                var fstr = "yy-mm-dd";
                if (stx=="m")
                {
                    fstr = 'yy-mm';
                }
                $(this).val($.datepicker.formatDate(fstr, rdt));
            }
        }
    });

    $(selector).focus(function () {
        var stx = getPickerStyleMode(this);
        // check values
        if (stx==="m")
        {
            $(".ui-datepicker-calendar").hide();
        }
        else
        {
            $(".ui-datepicker-calendar").show();
        }
        $(this).find("#ui-datepicker-div").position({
            my: "center top",
            at: "center bottom",
            of: $(this)
        });
    });
}

function createDatePicker(selector,style,cb)
{
	var dd = style.indexOf("d")>-1;
	
	$(selector).attr('DisplayDay',dd);
    $(selector).attr('DateStyle',style);

    $(selector).datepicker({
        dateFormat: style,
        changeMonth: true,
        changeYear: true,
        showButtonPanel: true,
        onClose: function(dateText, inst) {
            var mx = inst.selectedMonth;
            var yx = inst.selectedYear;
            var dx = inst.selectedDay;
            var rdt = new Date(yx,mx,dx);
            if(cb){
                cb(rdt);
            }
            else{
                var stx =  $(this).attr('DateStyle');   
                $(this).val($.datepicker.formatDate(stx, rdt));
            }
        }
    });

    $(selector).focus(function () {
        var stx =    $(this).attr('DisplayDay');
        switch(stx){
            case false:
            {
                $(".ui-datepicker-calendar").hide();
                break;
            }
            default:
            {
                $(".ui-datepicker-calendar").show();
                break;
            }
        }
        $(this).find("#ui-datepicker-div").position({
            my: "center top",
            at: "center bottom",
            of: $(this)
        });
    });
	$("#ui-datepicker-div").hide();    
}

function createDatePickerWithFormat(selector,dateFormatString,cb)
{

    $(selector).datepicker({
        dateFormat: dateFormatString,
        changeMonth: true,
        changeYear: true,
        showButtonPanel: true,
        onClose: function(dateText, inst) {
            var mx = inst.selectedMonth;
            var yx = inst.selectedYear;
            var dx = inst.selectedDay;
            var rdt = new Date(yx,mx,dx);
            if(cb){
                cb(rdt);
            }
        }
    });
}
