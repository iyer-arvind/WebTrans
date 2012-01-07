function M17NHandle(id,mimName)
{
	this.elId=id;
	this.mimName=mimName;
	this.mim=new MIM("test",this);
}
M17NHandle.prototype.ready=function()
{
	console.log(this.elId);
	$(this.elId).css("background-color","#eeeeee");
	$(this.elId).attr("tabindex",0)
	$(this.elId).focus();
	$(this.elId).keypress({"handler":this},
	function(ev)
	{
		console.log(ev);
		ev.data.handler.mim.handleKey(String.fromCharCode(ev.keyCode));
		$(ev.data.handler.elId).html("<font style=\"color:#ff0000\">"+ev.data.handler.mim.parsedBuffer   +"</font>"+
					     "<font style=\"color:#ff9933\">"+ev.data.handler.mim.preCommitBuffer+"</font>"+
					     "<font style=\"color:#009900\">"+ev.data.handler.mim.tempBuffer     +"</font>");
	});
	
}
