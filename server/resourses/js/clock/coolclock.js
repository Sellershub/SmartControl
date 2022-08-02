/*
CoolClock by Simon Baird (simon dot baird at gmail dot com)
Version 1.0.6 (08-Jul-2008)
See http://simonbaird.com/coolclock/

Copyright (c) Simon Baird 2006-2008

Redistribution and use in source and binary forms, with or without modification,
are permitted provided that the following conditions are met:

Redistributions of source code must retain the above copyright notice, this
list of conditions and the following disclaimer.

Redistributions in binary form must reproduce the above copyright notice, this
list of conditions and the following disclaimer in the documentation and/or other
materials provided with the distribution.

Neither the name of the Simon Baird nor the names of other contributors may be
used to endorse or promote products derived from this software without specific
prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT
SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT,
INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED
TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR
BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN
ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH
DAMAGE.
*/

window.CoolClock = function(canvasId,backImageName,skinId,showSecondHand,gmtOffset,canW,canH,offX,offY) {
	return this.init(canvasId,backImageName,skinId,showSecondHand,gmtOffset,canW,canH,offX,offY);
}

CoolClock.findAndCreateClocks = function() {
	var canvases = document.getElementsByTagName("canvas");
	for (var i=0;i<canvases.length;i++) {
		var fields = canvases[i].className.split(" ")[0].split(":");
		if (fields[0] == "CoolClock") {
//			new CoolClock(canvases[i].id,fields[2],fields[1],fields[3]!="noSeconds",fields[4]);
			try{
				new CoolClock(canvases[i].id,fields[2],fields[1],fields[3]!="noSeconds",fields[4],fields[5],fields[6],fields[7],fields[8]);
			}
			catch(exx)
			{
				alert("CoolClock.findAndCreateClocks exception:"+exx); 
				new CoolClock(canvases[i].id,fields[2],fields[1],fields[3]!="noSeconds",fields[4]);
			}
		}
	}
}

// borrowed from behaviour.js
// actually doesn't work right unless it's at the end of html document
// hence can't have a body onload
// this is a bug. FIXME
// maybe have a setTimeout hack??
CoolClock.addLoadEvent = function(func){
	var oldonload = window.onload;
	if (typeof window.onload != 'function')
		window.onload = func;
	else
		window.onload = function() {
			oldonload();
			func();
		}
}

CoolClock.config = {
	clockTracker: {},
	tickDelay: 1000,
	longTickDelay: 15000,
	renderRadius: 100,
	defaultSkin: "swissRail",
	skins:	{
		// more skins in moreskins.js
		// try making your own...

		
	swissRail: {
			outerBorder: { lineWidth: 1, radius:190, color: "black", alpha: 1 },
			smallIndicator: { lineWidth: 2, startAt: 178, endAt: 186, color: "black", alpha: 1 },
			largeIndicator: { lineWidth: 4, startAt: 160, endAt: 186, color: "black", alpha: 1 },
			hourHand: { lineWidth: 10, startAt: -30, endAt: 90, color: "black", alpha: 1 },
			minuteHand: { lineWidth: 7, startAt: -30, endAt: 150, color: "black", alpha: 1 },
			secondHand: { lineWidth: 1, startAt: -40, endAt: 170, color: "red", alpha: 1 },
			secondDecoration: { lineWidth: 1, startAt: 140, radius: 8, fillColor: "red", color: "red", alpha: 1 }
		},
	swissRailInternal: {
			outerBorder: { lineWidth: 0, radius:190, color: "black", alpha: 1 },
			smallIndicator: { lineWidth: 0, startAt: 178, endAt: 186, color: "black", alpha: 1 },
			largeIndicator: { lineWidth: 0, startAt: 160, endAt: 186, color: "black", alpha: 1 },
			hourHand: { lineWidth: 10, startAt: -30, endAt: 90, color: "black", alpha: 1 },
			minuteHand: { lineWidth: 7, startAt: -30, endAt: 133, color: "black", alpha: 1 },
			secondHand: { lineWidth: 1, startAt: -40, endAt: 145, color: "red", alpha: 1 },
			secondDecoration: { lineWidth: 1, startAt: 110, radius: 6, fillColor: "red", color: "red", alpha: 1 }
		}
	}
};

CoolClock.prototype = {
	init: function(canvasId,backImageName,skinId,showSecondHand,gmtOffset,canW,canH,offX,offY) {
		this.canvasId = canvasId;
		if(backImageName)
		{
			this.backImage = new Image();
			this.backImage.src = backImageName;
		}
		this.isIE = false;
		this.skinId = skinId || CoolClock.config.defaultSkin;
		this.showSecondHand = typeof showSecondHand == "boolean" ? showSecondHand : true;
		this.tickDelay = CoolClock.config[ this.showSecondHand ? "tickDelay" : "longTickDelay"];

		this.canvas = document.getElementById(canvasId);
		
		this.cW = this.canvas.clientWidth;
		this.cH = this.canvas.clientHeight;
		this.canvas.setAttribute("width",this.cW);
		this.canvas.setAttribute("height",this.cH);
	
		this.offsetX = (offX)?offX:0;
		this.offsetY = (offY)?offY:0; 
		this.offsetX = this.offsetX*-1;
		this.offsetY = this.offsetY*-1;
	
		this.cW = (canW)?canW: this.cW;
		this.cH = (canH)?canH:this.cH;
		
		this.displayRadiusX = this.cW/2;
		this.displayRadiusY = this.cH/2;
		
	//	this.canvas.style.width = this.canvas.clientWidth+"px";
	//	this.canvas.style.height =this.canvas.clientHeight + "px";

//		this.renderRadius = CoolClock.config.renderRadius; 
		var skin = CoolClock.config.skins[this.skinId];
 	    this.renderRadius = skin.outerBorder.radius;

		this.scaleX = this.displayRadiusX / this.renderRadius;
		this.scaleY = this.displayRadiusY / this.renderRadius;
		this.scale = (this.scaleX>this.scaleY)?this.scaleX:this.scaleY;
		
	
		
		// code for IE browsers
		if (window.G_vmlCanvasManager)
		{
			this.canvas = window.G_vmlCanvasManager.initElement(this.canvas);
			this.isIE = true;
		}

		this.ctx = this.canvas.getContext("2d");
		this.ctx.scale(this.scaleX,this.scaleY);

		this.offsetX = this.offsetX / this.scaleX;
		this.offsetY = this.offsetY / this.scaleY;

		try
		{		
			this.gmtOffset = gmtOffset != null ? parseFloat(gmtOffset) : gmtOffset;
			if(isNaN(this.gmtOffset))
			{
				this.gmtOffset = null;
			}
		}
		catch(exxgmt)
		{
			this.gmtOffset = null;
		}
		CoolClock.config.clockTracker[canvasId] = this;
		this.tick();
		return this;
	},

	fullCircle: function(skin) {
		this.fullCircleAt(this.renderRadius,this.renderRadius,skin);
	},

	fullCircleAt: function(x,y,skin) {
		with (this.ctx) {
			save();
			globalAlpha = skin.alpha;
			lineWidth = skin.lineWidth;
			if (!document.all)
				beginPath();
			if (document.all)
				// excanvas doesn't scale line width so we will do it here
				lineWidth = lineWidth * this.scale;
			arc(x, y, skin.radius, 0, 2*Math.PI, false);
			if (document.all)
				// excanvas doesn't close the circle so let's color in the gap
				arc(x, y, skin.radius, -0.1, 0.1, false);
			if (skin.fillColor) {
				fillStyle = skin.fillColor
				fill();
			}
			else {
				// XXX why not stroke and fill
				strokeStyle = skin.color;
				stroke();
			}
			restore();
		}
	},

	radialLineAtAngle: function(angleFraction,skin) {
		with (this.ctx) {
			save();
			//translate(this.renderRadius,this.renderRadius);
			translate(this.renderRadius+this.offsetX,this.renderRadius+this.offsetY);
			rotate(Math.PI * (2 * angleFraction - 0.5));
			globalAlpha = skin.alpha;
			strokeStyle = skin.color;
			lineWidth = skin.lineWidth;
			if (document.all)
				// excanvas doesn't scale line width so we will do it here
				lineWidth = lineWidth * this.scale;
			if (skin.radius) {
				this.fullCircleAt(skin.startAt,0,skin)
			}
			else {
				beginPath();
				moveTo(skin.startAt,0)
				lineTo(skin.endAt,0);
				stroke();
			}
			restore();
		}
	},

	render: function(hour,min,sec) {
		var skin = CoolClock.config.skins[this.skinId];
//		this.ctx.clearRect(0,0,this.canvas.clientWidth,this.canvas.clientHeight);
		this.ctx.clearRect(0,0,this.cW/this.scaleX,this.cH/this.scaleY);

		// draw backimage
		try{
			if(this.backImage){
				/*if(this.isIE){
					this.ctx.drawImage(this.backImage,0,0,this.cW,this.cH);
				}
				else{
					this.ctx.drawImage(this.backImage,0,0,this.cW/this.scaleX,this.cH/this.scaleY);
				}*/
				if(this.isIE){
					this.ctx.drawImage(this.backImage,this.offsetXs,this.offsetY,this.cW,this.cH);
				}
				else{
 					this.ctx.drawImage(this.backImage,this.offsetX,this.offsetY,this.cW/this.scaleX,this.cH/this.scaleY);  
				}
			}
		}catch(err){
		}
			
		if(skin.outerBorder.lineWidth > 0){
			this.fullCircle(skin.outerBorder);
		}
		if(skin.smallIndicator.lineWidth>0 || skin.largeIndicator.lineWidth > 0){
			for (var i=0;i<60;i++){
					this.radialLineAtAngle(i/60,skin[ i%5 ? "smallIndicator" : "largeIndicator"]);
			}
		}
		this.radialLineAtAngle((hour+min/60)/12,skin.hourHand);
		this.radialLineAtAngle((min+sec/60)/60,skin.minuteHand);
		if (this.showSecondHand) {
			this.radialLineAtAngle(sec/60,skin.secondHand);
			if (!document.all)
				// decoration doesn't render right in IE so lets turn it off
				this.radialLineAtAngle(sec/60,skin.secondDecoration);
		}
	},


	nextTick: function() {
		setTimeout("CoolClock.config.clockTracker['"+this.canvasId+"'].tick()",this.tickDelay);
	},

	stillHere: function() {
		return document.getElementById(this.canvasId) != null;
	},

	refreshDisplay: function() {
		var now = new Date();
		if (this.gmtOffset != null) {
			// use GMT + gmtOffset
			var offsetNow = new Date(now.valueOf() + (this.gmtOffset * 1000 * 60 * 60));
			this.render(offsetNow.getUTCHours(),offsetNow.getUTCMinutes(),offsetNow.getUTCSeconds());
		}
		else {
			// use local time
			this.render(now.getHours(),now.getMinutes(),now.getSeconds());
		}
	},

	tick: function() {
		if (this.stillHere()) {
			this.refreshDisplay()
			this.nextTick();
		}
	}
}

//CoolClock.addLoadEvent(CoolClock.findAndCreateClocks);

