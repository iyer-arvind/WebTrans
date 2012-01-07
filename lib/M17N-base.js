//console.log=function(){}
MIMAction=function(def)
{
	if(def==null)
	{
		this.action="null";
	}
	else if(typeof(def)=="string" || def.hasOwnProperty('keyName'))
	{
		this.action="insert";
		this.args=def;
	}
	else if(def.hasOwnProperty('length'))
	{
		this.action=def.shift();
		if(def.length)
			this.args=def;
		
	}
	else
	{
		console.log("unhandled",def);
	}
}
MIMAction.prototype.doAction=function(mim,chr,match)
{
	console.log("==================================",mim,chr,match,this)
	switch(this.action)
	{
		case "null":
			break;
		case "pushback":
			var n=parseInt(this.args[0]);
			for(var i=0;i<n;i++)
			{
				mim.pushBack(chr[i])
			}
			break;
		case "shift":
			var s=this.args[0]
			mim.shiftState(s);
			break;
		case "insert":
			mim.insert(this.args)
			break;
		case "delete":
			mim.del(this.args[0])
			break;
		default:
			console.warn("unhandled action",this.action,this.args)
	}
}
Key=function(keyName)
{
	this.keyName=keyName;
}
MIMMap=function(map)
{
	this.patterns=new Object();
	for(var mi in map)
	{
		var m=map[mi];
		var key=m.shift();
		if(typeof key=='string')
		{
			if(m.length)
			{
				for(var mii in m)
				{
					if(!this.patterns[key])this.patterns[key]=new Array();
					this.patterns[key].push(new MIMAction(m[mii]));
				}
			}
			else
			{
					if(!this.patterns[key])this.patterns[key]=new Array();
					this.patterns[key].push(new MIMAction(null));
			}
		}
		else
		{
			var keyName="__key__"+key[0]+"__";
			if(!this.patterns[keyName])this.patterns[keyName]=new Array();
			this.patterns[keyName]=new MIMAction(new Key(key[0]));
		}
	}
}
MIMMap.prototype.handleKey=function(chr)
{
	var n=0;
	var m=0;
	var matches=new Array();
	var match=null;
	for(var i in this.patterns)
	{
		if(i.search(chr)==0)
		{
			n+=1;
			if(i==chr)
			{
				m+=1;
				match=this.patterns[i];
			}
			matches.push({"key":i,"match":this.patterns[i]});
			
		}
	}
	if(n==0)return {"n":0,"matches":matches,"match":match};
	if(n==1)if(m==1)return {"n":1,"matches":matches[0],"match":match};
	if(m==1)return {"n":2,"matches":matches,"match":match};
	return {"n":3,"matches":matches,"match":match};
}
State=function(name,rules,mim)
{
	this.name=name;
	this.mim=mim;
	this.patterns=new Array();
	for(var ri in rules)
	{
		var r=rules[ri];
		pattern=new Object();
		pattern.map=r.shift();
		pattern.actions=new Array();
		for(var ai in r)
		{
			pattern.actions.push(new MIMAction(r[ai]));
		}
		this.patterns.push(pattern);
	}
	this.tempChr="";
	this.tempPattern=null;
}
State.prototype.handleKey=function(chr)
{
	var pat=this.tempChr;
	pat+=chr;
	done=false;
	var pList
	if(this.tempChr.length)
	{
		pList=[this.tempPattern];
	}
	else
	{
		pList=this.patterns;
	}
	for(var pi in pList)
	{
		var p=pList[pi];
		var match=this.mim.maps[p.map].handleKey(pat);
		console.log("testing \""+pat+"\" with",p.map,match);
		var matchMode=match.n;
		switch(matchMode)
		{
			case 0:
				console.log("no matches possible");
				this.mim.tempBuffer="";
				if(this.tempChr.length)
				{
					this.doActions(this.tempPattern,this.tempChr,this.tempMatch)
					this.tempChr=""
					this.tempPattern=null;
					this.tempMatch=null;
					this.mim.pushBack(chr);
					this.mim.releaseHandler();
				}
				break;
			case 1:console.log("one and only one match possible");				
				this.mim.tempBuffer="";
				this.doActions(p,chr,match);
				if(this.tempChr.length)
				{
					//this.doActions(this.tempPattern,this.tempChr,this.tempMatch)
					this.tempChr=""
					this.tempPattern=null;
					this.tempMatch=null;
					this.mim.releaseHandler();
				}
				done=true;
				break;
			case 2:console.log("match possible but more matches possible");
				this.tempChr+=chr;
				this.tempPattern=p;
				this.tempMatch=match;
				this.mim.retainHandler(this);
				done=true;
//				for(var i in )
				this.mim.tempBuffer=(match.match[0].action=="insert"?match.match[0].args:"");
				break;
				
			case 3:console.log("no match possible but more matches may be possible");	
				this.tempChr+=chr;
				this.tempPattern=p;
				this.tempMatch=match;
				this.mim.retainHandler(this);
				done=true;
				break;
		}
		if(done)break;
	}
	if(!done)
	{
		this.mim.commit();
		this.mim.parsedBuffer+=chr;
	}
}
State.prototype.doActions=function(p,chr,m)
{
	for(var ai in m.match)
		m.match[ai].doAction(this.mim,chr,m);
	for(var ai in p.actions)
	{
		p.actions[ai].doAction(this.mim,chr,m);
	}
}


MIM=function(mimName,onReady)
{
	this.onReady=onReady;
	$.ajax(
		{
			url:"mim/hi-itrans.mim",
			context:this,
			success:function(data)
			{
				console.log(this);
				this.loadMim(parseMimFile(data));
				this.onReady.ready();
			}
		});
}

MIM.prototype.loadMim=function(mimArray)
{
	this.maps=new Object();
	this.initState="";
	this.states=new Object();
	this.keyEventBuffer=new Array();
	for(var i in mimArray)
	{
		var m=mimArray[i];
		switch(m.shift())
		{
			case "input-method":this.inputMethod=m.join(' ');break;
			case "description":this.description=m.join(' ');break;
			case "title":this.title=m[0];break;
			case "map":for(var ii in m){this.maps[m[ii].shift()]=new MIMMap(m[ii]);};break;
			case "state":
			{
				for(var ii in m)
				{
					var mm=m[ii];
					if(ii==0)this.initState=mm[0];
					var stateName=mm.shift();
					this.states[stateName]=new State(stateName,mm,this);
				}
			}
		}
	}
	this.currentHandler=this.states[this.initState];
	this.preCommitBuffer="";
	this.parsedBuffer="";
	this.tempBuffer="";
}
MIM.prototype.handleKey=function(chr)
{
	console.group(chr)
	this.keyEventBuffer.push(chr)
	this.__handle();
	console.groupEnd()
}
MIM.prototype.__handle=function()
{
	console.log("current handler",this.currentHandler)
	while(this.keyEventBuffer.length)
		this.currentHandler.handleKey(this.keyEventBuffer.shift());
}
MIM.prototype.pushBack=function(chr)
{
	console.log("pushing back",chr);
	var ca=chr.split("");
	while(ca.length)
		this.keyEventBuffer.push(ca.shift());
}
MIM.prototype.retainHandler=function(handler)
{
	console.log("Retaining handler")
	this.backupHandler=this.currentHandler
	this.currentHandler=handler;
}
MIM.prototype.insert=function(txt)
{
	console.log("inserting",txt)
	this.preCommitBuffer+=txt;
}
MIM.prototype.del=function(sym)
{
	console.log("deleting",sym)
	switch(sym)
	{
		case "@-":
			this.preCommitBuffer=this.preCommitBuffer.substr(0,this.preCommitBuffer.length-1)
			break;
		default:
			console.warn("unhandled symbol",sym)
	}
}

MIM.prototype.shiftState=function(state)
{
	if(state==this.initState)
	{
		this.commit();
	}
	console.log("shifting to state",state)
	this.currentHandler=this.states[state];
	this.backupHandler=null;
}
MIM.prototype.commit=function()
{
	this.parsedBuffer+=this.preCommitBuffer;
	this.preCommitBuffer="";
}
MIM.prototype.releaseHandler=function()
{
	console.log("Releasing handler")
	if(this.backupHandler)
		this.currentHandler=this.backupHandler;
	this.backupHandler=null;
	this.__handle();
}


parseMimFile=function(data)
{ 
	var data=compressData(data);
	var collect=false;

	var dataTree=new Array([]);
	var currentPath=new Array([]);

	var txt="";
	for(var i in data)
	{
		var c=data[i];
		if(c=="(")
		{
			currentPath.push(new Array());
			var j=currentPath.length;
			currentPath[j-2].push(currentPath[j-1]);
			continue;
		}
		if(c=="\"")
		{
			collect=!collect;
			continue;
		}
		var j=currentPath.length;
		if(c==")")
		{
			
			if(txt.length)
			currentPath[j-1].push(txt);
			txt="";
			currentPath.pop();
			continue;
		}
		if((c==" " || c== "\t")&& !collect)
		{
			if(txt.length)
			currentPath[j-1].push(txt);
			txt="";
		}
		else
		{
			txt+=c;
		}
		
	}
	return currentPath[0];
}

compressData=function(data)
{
	var dList=data.split('\n');
	var cData="";
	for(var i in dList)
	{
		var line=dList[i];
		if(line.indexOf(";")>=0)
			line=line.substring(0,line.indexOf(";"));
		if(!line.length)continue;
		cData+=line;
	}
	return cData;
}

