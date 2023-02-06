"use strict";
var g = {
	exponents: N(0),
	zp: N(0),
	notation: "Mixed scientific",
	overflowUnlocked: false,
	autobuyerDimensions: [null,N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0)],
	purchasedAutobuyerDimensions: [null,N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0)],
	timeUpgrades: N(0),
	quasars: N(0),
	transfinite: false,
	overflowPoints: N(0),
	timePlayed: 0,
	timeSinceOverflow: 0,
	overflowUpgrades: [],
	overflowResets: 0
}

function expBase() {
	return 10
}
function increment() {
  o.add("exponents",1);
}
function numToExp(num,base,minlength=4) {
	num=N(num).floor()
	if (num.eq(0)) return [[N(0),N(0)]]
	base=N(base)
	let exp = num.max(1).log(base).add(1e-11).floor()
	let pairs = 0
	let out = []
	while (num.gte(1)&&pairs<minlength) {
		let val = num.div(base.pow(exp)).add(1e-11).floor()
		out.push([val,exp])
		num=num.sub(base.pow(exp).mul(val))
		exp=exp.sub(1)
		if (exp.lt(0)) break
		pairs++
	}
	return out
}
function formatExponents(num,base,minlength=4) {
	if (num.gte(N(expBase()).pow(256))) return "1 ^Infinity"
	let out = numToExp(num,base,minlength)
	if (out.length == 0) return "0 ^0"
	return out.map(x => x[0].format(0)+" ^"+x[1].format(0)).join(", ")
}
function expToNum(array,base) {
	base=N(base)
	let out = N(0)
	for (let i=0;i<array.length;i++) out = out.add(base.pow(array[i][1]).mul(array[i][0]))
	return out
}

function prestigeGain() {
	if (g.exponents.lt(100)) return N(0)
	let out = g.exponents.sqrt()
	return out.floor()
}
function prestige() {
  if (g.exponents.gte(100)) {
    o.add("zp",prestigeGain());
    g.exponents = N(0)
		g.prestigeUnlocked = true
  }
}

function tab(numbr) {
	let tabs = d.class("tab").length
	for (let i=0;i<tabs;i++) d.display("tab"+i,"none")
  d.display("tab"+numbr,"inline-block")
}
function subtab(domain,numbr) {
	let tabs = d.class(domain+"tab").length
	for (let i=0;i<tabs;i++) d.display(domain+"tab"+i,"none")
  d.display(domain+"tab"+numbr,"inline-block")
}

function ordinal(x) {
	if ((x%10==1)&&(x%100!==11)) return x+"st"
	if ((x%10==2)&&(x%100!==12)) return x+"nd"
	if ((x%10==3)&&(x%100!==13)) return x+"rd"
	return x+"th"
}
function generateDimensionTable() {
	for (let i=1;i<=12;i++) {
		d.element("dimensionTable").innerHTML += "<tr><td style=\"width:250px\">"+ordinal(i)+" Autobuyer Dimension (×<span id=\"autobuyerDimension"+i+"Mult\"></span>)</td><td style=\"width:150px\" id=\"autobuyerDimension"+i+"Amount\"></td><td style=\"width:150px\" id=\"autobuyerDimension"+i+"PerSec\"></td><td style=\"width:200px\" id=\"purchasedAutobuyerDimension"+i+"Amount\"></td><td style=\"width:200px\"><button id=\"buyAutobuyerDimension"+i+"\" onClick=\"buyAutobuyerDimension("+i+")\"></button></td></tr>"
	} 
}
generateDimensionTable()
function dimensionMultiplier(x) {
	let out = timeMultiplier()
	out = out.mul(N(2).pow(g.purchasedAutobuyerDimensions[x]))
	return out
}
var baseDimensionCosts = [null,0,2,5,9,14,20,27,35,100,150,200,250]
var dimensionCostGrowth = [null,2,3,4,5,6,7,8,10,20,30,50,100]
function dimensionCost(x,amount) {
	amount = (amount==undefined)?g.purchasedAutobuyerDimensions[x]:N(amount)
	let baseExp = amount.mul(dimensionCostGrowth[x]).add(baseDimensionCosts[x])
	return Decimal.pow(expBase(),baseExp.gt(256)?baseExp.pow(2).div(256):baseExp)
}
function affordableDimension(x,amount) {
	amount = (amount==undefined)?g.exponents:N(amount)
	let baseExp = amount.log(expBase())
	return (baseExp.gt(256)?baseExp.sqrt().mul(16):baseExp).sub(baseDimensionCosts[x]).div(dimensionCostGrowth[x]).add(1).floor()
}
function buyAutobuyerDimension(x) {
	if (g.exponents.gt(dimensionCost(x))) {
		o.sub("exponents",dimensionCost(x))
		g.autobuyerDimensions[x]=g.autobuyerDimensions[x].add(1)
		g.purchasedAutobuyerDimensions[x]=g.purchasedAutobuyerDimensions[x].add(1)
	}
}
function buyMaxDimensions() {
	for (let i=1;i<=12;i++) {
		if (g.exponents.lt(dimensionCost(i))) continue
		let amount = affordableDimension(i)
		o.sub("exponents",dimensionCost(i,amount.sub(1)))
		let realAmount = amount.sub(g.purchasedAutobuyerDimensions[i])
		g.autobuyerDimensions[i]=g.autobuyerDimensions[i].add(realAmount)
		g.purchasedAutobuyerDimensions[i]=g.purchasedAutobuyerDimensions[i].add(realAmount)
	}
}
function dimensionPerSec(x) {
	if (x==12) return N(0)
	return g.autobuyerDimensions[x+1].mul(dimensionMultiplier(x+1))
}
function timeUpgradeCost(amount) {
	amount=(amount==undefined)?g.timeUpgrades:N(amount)
	return Decimal.pow(expBase(),amount.gt(54)?amount.add(10).pow(2).div(64):amount.add(10))
}
function affordableTimeUpgrades(amount) {
	amount = (amount==undefined)?g.exponents:N(amount)
	let baseExp = amount.log(expBase())
	return (baseExp.gt(64)?baseExp.sqrt().mul(8):baseExp).sub(9).floor()
}
function buySingleTimeUpgrade() {
	if (g.exponents.gt(timeUpgradeCost())) {
		o.sub("exponents",timeUpgradeCost())
		o.add("timeUpgrades",1)
	}
}
function buyMaxTickspeed() {
	if (g.exponents.gt(timeUpgradeCost())) {
		g.timeUpgrades=affordableTimeUpgrades()
		o.sub("exponents",timeUpgradeCost(g.timeUpgrades.sub(1)))
	}
}
function timeUpgradeMultiplier() {
	let out = N(quasarEffect()).pow(realQuasars()).mul(0.15).add(1)
	return out
}
function timeMultiplier() {
	let out = timeUpgradeMultiplier().pow(g.timeUpgrades)
	return out
}
function quasarReq() {
	let out = (g.quasars.gt(32)?g.quasars.pow(2).div(32):g.quasars).add(4).pow(2).mul(8)
	return N(expBase()).pow(out)
}
function affordableQuasars() {
	let out = g.exponents.log(expBase()).div(8).sqrt(2).sub(4)
	return (out.gt(32)?out.mul(32).sqrt():out).ceil().max(0)
}
function gainQuasar() {
	if (affordableQuasars().gt(g.quasars)) {
		g.quasars=affordableQuasars()
		g.exponents=N(0)
		g.autobuyerDimensions=[null,N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0)]
		g.purchasedAutobuyerDimensions=[null,N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0)]
		g.timeUpgrades=N(0)
	}
}
function realQuasars() {
	let out = g.quasars
	return out
}
function quasarPower() {
	let out = N(1)
	return out
}
function quasarEffect() {
	let out = N(1.2).pow(quasarPower())
	return out
}

var overflowEventActive = false
function OPgain() {
	let out = expToNum(numToExp(g.exponents,expBase()),expBase()).root(256).div(10)
	return out.floor()
}
function overflow() {
	if (g.exponents.gt(N(expBase()).pow(256))) {
		o.add("overflowPoints",OPgain())
		g.exponents=N(0)
		g.autobuyerDimensions=[null,N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0)]
		g.purchasedAutobuyerDimensions=[null,N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0),N(0)]
		g.timeUpgrades=N(0)
		g.quasars=N(0)
		g.overflowUnlocked=true
		overflowEventActive=false
		g.overflowResets++
	}
}
var overflowUpgrades = {
	11:{
		effect:function(){return N(Math.log10(10+g.timeSinceOverflow/960)**Math.log2(10))},
		text:function(){return "All Autobuyer Dimensions work "+this.effect().format(2)+"× faster (based on time since overflow)"},
		cost:"1"
	},
	21:{
		effect:function(){return Decimal.powerTower(1.1,numToExp(g.exponents,expBase())[0][1],0.7)},
		text:function(){return "The 1st and 12th Autobuyer Dimension work "+this.effect().format(2)+"× faster (based on highest exponent)"},
		cost:"1"
	},
	22:{
		effect:function(){return Decimal.powerTower(1.15,g.timeUpgrades,0.8)},
		text:function(){return "The 2nd and 11th Autobuyer Dimension work "+this.effect().format(2)+"× faster (based on time upgrades)"},
		cost:"1"
	},
	23:{
		effect:function(){return g.overflowPoints.add(10).dilate(0.9).div(10)},
		text:function(){return "The 3rd and 10th Autobuyer Dimension work "+this.effect().format(2)+"× faster (based on unspent overflow points)"},
		cost:"1"
	},
	31:{
		effect:function(){return g.autobuyerDimensions[1].add(1).pow(0.001).add(9).log10().pow(20)},
		text:function(){return "The 4th and 9th Autobuyer Dimension work "+this.effect().format(2)+"× faster (based on 1st Autobuyer Dimensions)"},
		cost:"1"
	},
	32:{
		effect:function(){return N(g.overflowResets).div(4).add(1)},
		text:function(){return "The 5th and 8th Autobuyer Dimension work "+this.effect().format(2)+"× faster (based on overflow resets done)"},
		cost:"1"
	},
	33:{
		effect:function(){return N(1.2).pow(g.overflowUpgrades.length)},
		text:function(){return "The 6th and 7th Autobuyer Dimension work "+this.effect().format(2)+"× faster (based on total overflow upgrades)"},
		cost:"1"
	}
}

var oldframe = Date.now()
var deltatime = 0
function loop() {
	deltatime = (Date.now()-oldframe)/1000
	oldframe+=deltatime*1000
  document.getElementById("prestigebutton").innerHTML = g.exponents.gte(100)?("Prestige for "+prestigeGain().format(0)+" ZP"):"Reach ^2 to prestige";
  document.getElementById("exponentList").innerHTML = "You have "+formatExponents(g.exponents,expBase())
  document.getElementById("exponentsPerSec").innerHTML = "You are gaining "+formatExponents(dimensionPerSec(0),expBase())+" per second"
	save()
	d.display("tab1button",g.overflowUnlocked?"inline-block":"none")
	for (let i=1;i<=12;i++) {
		d.innerHTML("autobuyerDimension"+i+"Amount",g.autobuyerDimensions[i].format(0))
		d.innerHTML("purchasedAutobuyerDimension"+i+"Amount","("+g.purchasedAutobuyerDimensions[i].format(0)+" purchased)")
		d.innerHTML("autobuyerDimension"+i+"Mult",dimensionMultiplier(i).format(2))
		d.innerHTML("autobuyerDimension"+i+"PerSec",dimensionPerSec(i).eq(0)?"":("("+dimensionPerSec(i).format(2)+" / s)"))
		d.innerHTML("buyAutobuyerDimension"+i,"Cost: "+formatExponents(dimensionCost(i),expBase(),dimensionCost(i).gt(N(expBase()).pow(256))?2:1))
		if (i==1) o.add("exponents",dimensionPerSec(0).mul(deltatime))
		else g.autobuyerDimensions[i-1]=g.autobuyerDimensions[i-1].add(dimensionPerSec(i-1).mul(deltatime))
	}
	g.timePlayed+=deltatime
	g.timeSinceOverflow+=deltatime
	d.innerHTML("spanTickspeed",timeMultiplier().format(2))
	d.innerHTML("spanTimeUpgrades",g.timeUpgrades.format(0))
	d.innerHTML("spanTickspeedMult",timeUpgradeMultiplier().format(2))
	d.innerHTML("buttonTickspeed","Cost: "+formatExponents(timeUpgradeCost(),expBase(),timeUpgradeCost().gt(N(expBase()).pow(64))?2:1))
	d.display("timeUpgradeDiv",(g.autobuyerDimensions[4].gt(0)||g.quasars.gt(0))?"inline-block":"none")
	d.innerHTML("spanQuasars",g.quasars.format(0))
	d.innerHTML("spanQuasarEffect",quasarEffect().sub(1).mul(100).format(1))
	d.innerHTML("gainQuasar",g.exponents.gt(quasarReq())?"Reset progress to gain a Quasar":("Need "+formatExponents(quasarReq(),expBase())))
	d.display("quasarDiv",(g.autobuyerDimensions[9].gt(0)||g.quasars.gt(0))?"inline-block":"none")
	if (g.exponents.gte(N(expBase()).pow(256))&&!g.transfinite) {
		tab(1)
		subtab("prestige",0)
		overflowEventActive = true
		g.exponents=N(expBase()).pow(256)
	}
	d.display("globalNav",overflowEventActive?"none":"inline-block")
	d.display("overflowNav",overflowEventActive?"none":"inline-block")
	d.display("overflowTop",g.overflowUnlocked?"inline-block":"none")
	d.innerHTML("spanOverflowPoints","You have "+g.overflowPoints.format(0)+" Overflow Points")
}
      
function save() {
  localStorage.setItem("ZPsave",JSON.stringify(g)); 
}
function load() {
  let savegame = JSON.parse(localStorage.getItem("ZPsave"));
  if ((typeof savegame == "object") && (savegame !== null)) {
		let vars=Object.keys(g)
		for (let i=0; i<vars.length; i++) {
			if (savegame[vars[i]] !== undefined) {
				let value = savegame[vars[i]]
				g[vars[i]] = validDecimal(value)?N(value):value
			}
			for (let i=1;i<13;i++) {
				g.autobuyerDimensions[i]=N(g.autobuyerDimensions[i])
				g.purchasedAutobuyerDimensions[i]=N(g.purchasedAutobuyerDimensions[i])
			}
		}
  }
}
load()
setInterval(loop, 50);