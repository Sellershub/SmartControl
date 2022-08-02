
var __nw_al__sounds__ = {};

function nwal_addSound(name,resources)
{
     try{
       var sn = new Howl({urls: resources});
        __nw_al__sounds__[name] = sn;
    }
    catch (ex)
    {
        //nxa_alert("nwal_addSound sound:" + name + " , exception: "+ ex);
    }
};


function nwal_delSound(name)
{
    if(__nw_al__sounds__[name])
    {
        try{
            __nw_al__sounds__[name].unload();
        }
        catch (ex)
        {
            //nxa_alert("nwal_delSound sound:" + name + " , exception: "+ ex);
        }
        __nw_al__sounds__[name] = false;
    }
};

function nwal_playSound(name,loop)
{
    try{
        __nw_al__sounds__[name].loop(loop);
        __nw_al__sounds__[name].play();
    }
    catch (ex)
    {
        //nxa_alert("nwal_playSound sound:" + name + " , exception: "+ ex);
    }
}

function nwal_stopSound(name)
{
    try{
        __nw_al__sounds__[name].stop();
    }
    catch (ex)
    {
        //nxa_alert("nwal_stopSound sound:" + name + " , exception: "+ ex);
    }
}

function nwal_getBackObject(name)
{
     try{
        return __nw_al__sounds__[name];
    }
    catch (ex)
    {
        //nxa_alert("nwal_getBackObject sound:" + name + " , exception: "+ ex);
    }
}

function nwal_simplePlay(resources,opts)
{
    try{
        var snd =  {
            urls: resources,
            loop:false
        };
        if(opts)
        {
            $.extend(snd,opts); // extend the 
        }
        
        var sn = new Howl(snd);
        sn.play();
        return snd;
    }
    catch (ex)
    {
        //nxa_alert("nwal_simplePlay urls:" + urls + " , exception: "+ ex);
        return false;
    }    
}