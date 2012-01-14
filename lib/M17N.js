function M17NHandle(id,mimName)
{
	this.elId=id;
	this.mimName=mimName;
	this.mim=new MIM("test",this);
}
M17NHandle.prototype.ready=function()
{
	console.log(this.elId);
	$(this.elId).css("background-color","#ffffff");
	$(this.elId).attr("tabindex",0)
	$(this.elId).focus();
	$(this.elId).keypress({"handler":this},
	function(ev)
	{
		console.log(ev);
		ev.data.handler.mim.handleKey(String.fromCharCode(ev.keyCode));
		$(ev.data.handler.elId).html("<div style='float:left'><font style=\"color:#000055;font-size:12pt;\">"+ev.data.handler.mim.parsedBuffer   +"</font>"+
					     "<font style=\"color:#999999\">"+ev.data.handler.mim.tempBuffer     +"</font></div><div id=\"cursor\" style='margin:2px;width:1px;height:12pt;background-color:black;float:left'></div>"
						);
	});
	$(this.elId).html("<div id=\"cursor\" style='margin:2px;width:1px;height:12pt;background-color:black;float:left'></div>");

	setInterval(
		function()
		{
			if($("#cursor").css('display')=="none")	$("#cursor").css('display',"block");
			else					$("#cursor").css('display',"none");
		},500
	)
	$(this.elId).keydown({"handler":this},
	function(ev)
	{
		if(ev.keyCode==8)
		{
			ev.data.handler.mim.backSpace()
			$(ev.data.handler.elId).html("<div style='float:left'><font style=\"color:#000055;font-size:12pt;\">"+ev.data.handler.mim.parsedBuffer   +"</font>"+
						     "<font style=\"color:#999999\">"+ev.data.handler.mim.tempBuffer     +"</font></div><div id=\"cursor\" style='margin:2px;width:1px;height:12pt;background-color:black;float:left'></div>"
							);
		}
	});
	
}
