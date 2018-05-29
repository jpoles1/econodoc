var gpciSetting;

$.urlParam = function(name){
    var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
    if (results==null){
       return null;
    }
    else{
       return decodeURI(results[1]) || 0;
    }
}

function calcInpatientCost(costEntry){
    console.log("Inpatient Costs:", costEntry)
}
function calcOutpatientCost(costEntry, gpciEntry){
    if(costEntry.cost){
        return costEntry.cost.toFixed(2)
    }
    else if(costEntry["CONV FACTOR"] && costEntry["WORK RVU"] && costEntry["FACILITY PE RVU"] && costEntry["MP RVU"]){
        cost = costEntry["CONV FACTOR"] * ((costEntry["WORK RVU"] * gpciEntry["PW GPCI"]) + (costEntry["FACILITY PE RVU"] * gpciEntry["PE GPCI"]) + (costEntry["MP RVU"] * gpciEntry["MP GPCI"]))
        return cost.toFixed(2)
    }
    console.log("Error calculating cost for:", costEntry)
    return 0
}

//Calculate the cost of the care plan for a medicare outpatient
function outpatientPricetag(element, totalCost) {
    const medicareDeductible = 183
    var deductibleCost = Math.min(totalCost, medicareDeductible);
    deductibleCost = deductibleCost.toFixed(2)
    var copay = totalCost >  medicareDeductible ? (totalCost - 183) * .2 : 0
    copay = copay.toFixed(2)
    $(element).find(".patient-costs").html("$" + deductibleCost + " annual deductible<br>+<br>$" + copay + " copay")
}
function sumCosts(element) {
    var totalCost = 0.0
    $(element).find(".cost-value > .cost-number").each(function (_, entry) {
        cellValue = parseFloat($(entry).html())
        if (!isNaN(cellValue)) {
            totalCost += cellValue
        }
    })
    totalCost = totalCost.toFixed(2)
    $(element).find(".cost-total").html("$ " + totalCost);
    outpatientPricetag(element, totalCost)
    return totalCost
}

function generateURL() {
    interventionArray = []
    $(".cost-input-box > .awesomplete > .dropdown-input").each(function (_) {
        costName = $(this).val();
        if(costName.length > 0){
            interventionArray.push(costName)
        }
    })
    interventionString = encodeURIComponent(interventionArray.join(","))
    localeString = encodeURIComponent($("#locale-selector").val())
    baseURL = window.location.href.split('?')[0];
    //Can switch to using history.pushState 
    //though this may cause some issues w/ forward + back navigation and updating of data 
    history.replaceState(null, null, baseURL + "?locale=" + localeString + "&outpatient_interventions="+interventionString);
    updateURLBox()
}
function updateURLBox(){
    $(".url-box").val(window.location)
}

function urlLocale(gpci_data) {
    urlString = $.urlParam("locale")    
    if(urlString){
        urlString = decodeURIComponent(urlString)
        if(Object.keys(gpci_data).includes(urlString)){
            $("#locale-selector").val(urlString)
            gpciSetting = gpci_data[urlString]        
        }
    }
    gpciSetting = gpci_data[$("#locale-selector").val()]
}

function urlInterventions(urlParam, element, costData) {
    //Load in interventions
    urlString = $.urlParam(urlParam)
    if(!urlString){
        outpatientPricetag(element, sumCosts(element))
        return
    }
    urlString = decodeURIComponent(urlString)
    if (urlString.length > 0) {
        console.log(urlString)
        first = 1;
        $(urlString.split(",")).each(function (_, entry) {
            if (Object.keys(costData).includes(entry)) {
                if (!first) {
                    $(element).find(".care-list").append($(element).find(".cost-input-template").html())
                } else {
                    first = 0
                }
                $(element).find(".care-list").children(".cost-input").last().children(".cost-input-box").children("input").val(entry)
                $(element).find(".care-list").children(".cost-input").last().children(".cost-value").children(".cost-number").html(calcOutpatientCost(costData[entry], gpciSetting))
            }
        })
    }
    outpatientPricetag(element, sumCosts(element))
}
function updateCosts(element, costData){
    $(".cost-input-box > .awesomplete > .dropdown-input").each(function (_) {
        costName = $(this).val();
        if (Object.keys(costData).includes(costName)) {
            $(this).parent().parent().parent().children(".cost-value").children(".cost-number").html(calcOutpatientCost(costData[costName], gpciSetting))
        }
    })
    sumCosts(element)
}
function initializeLocaleInput(element, gpci_data, costData) {
    var localeInput = $("#locale-selector")
    var btn = localeInput.siblings("button").first();
    var comboplete = new Awesomplete(localeInput[0], {
        minChars: 0,
        autoFirst: false,
        list: Object.keys(gpci_data),
        maxItems: 500
    });
    $(btn).click(function () {
        if (comboplete.ul.childNodes.length === 0) {
            comboplete.minChars = 0;
            comboplete.evaluate();
        } else if (comboplete.ul.hasAttribute('hidden')) {
            comboplete.open();
        } else {
            comboplete.close();
        }
    });
    Awesomplete.$(localeInput[0]).addEventListener("awesomplete-selectcomplete", function () {
        gpciSetting = gpci_data[$(this).val()]
        updateCosts(element, costData)
        generateURL()
    })
}
function initializeCostInput(element, costFunction, costData) {
    console.log(costData)
    $(element).find(".cost-input-box > .dropdown-input").each(function (_, entry) {
        var btn = $(entry).siblings("button").first();
        var comboplete = new Awesomplete(entry, {
            minChars: 2,
            autoFirst: true,
            list: Object.keys(costData),
            maxItems: 500
        });
        $(btn).click(function () {
            if (comboplete.ul.childNodes.length === 0) {
                comboplete.minChars = 0;
                comboplete.evaluate();
            } else if (comboplete.ul.hasAttribute('hidden')) {
                comboplete.open();
            } else {
                comboplete.close();
            }
        });
        Awesomplete.$(entry).addEventListener("awesomplete-selectcomplete", function () {
            inputValue = $(this).val()
            updateCosts(element, costData)
            sumCosts(element)
            generateURL()
        })

    })
}

function activateDeleteButtons(element, costData){
    $(".delete-btn").click(function () {
        $(this).parents("tr").remove()
        sumCosts(element)
        generateURL()
        if ($(element).find(".cost-value").length < 1) {
            addCostEntry(element, costData)
        }
    })
}
function addCostEntry(element, costFunction, costData) {
    $(element).find(".care-list").append($(element).find(".cost-input-template").html())
    initializeCostInput(element, costFunction, costData)
    activateDeleteButtons(element, costData)
}

$(function () {
    var costData;
    if (window.matchMedia('(display-mode: standalone)').matches) {
        $(".url-box").parent().show()
    }
    updateURLBox()
    $(".url-box, #locale-selector").focus(function(){ 
        $(this).select(); 
    });
    $("#inpatient-panel").find(".care-list").append($("#inpatient-panel").find(".cost-input-template").html())
    $("#outpatient-panel").find(".care-list").append($("#outpatient-panel").find(".cost-input-template").html())
    $.getJSON("labs.json", function (labs_costs) {
        $.getJSON("gpci.json", function (gpci_data) {
            $.getJSON("rvu_costs.json", function (rvu_costs) {
                $.getJSON("drg_avg_costs.json", function (drg_avg_costs) {
                    gpciSetting = gpci_data[Object.keys(gpci_data)[0]]
                    outpatientCostData = Object.assign({}, labs_costs, rvu_costs);
                    urlLocale(gpci_data)
                    urlInterventions("outpatient_interventions", "#outpatient-panel", outpatientCostData)
                    initializeLocaleInput("#outpatient-panel", gpci_data, outpatientCostData)
                    _calcOutpatientCost = function(costEntry){
                        calcOutpatientCost(costEntry, gpciSetting)
                    }
                    initializeCostInput("#outpatient-panel", _calcOutpatientCost, outpatientCostData)
                    initializeCostInput("#inpatient-panel", calcInpatientCost, drg_avg_costs)
                    activateDeleteButtons("#outpatient-panel", outpatientCostData)
                    activateDeleteButtons("#inpatient-panel", drg_avg_costs)
                    $("#outpatient-panel").find(".add-cost").click(function () {
                        addCostEntry($(this).parents(".panel"), _calcOutpatientCost, outpatientCostData)
                        return false
                    })
                    $("#inpatient-panel").find(".add-cost").click(function () {
                        addCostEntry($(this).parents(".panel"), calcInpatientCost, drg_avg_costs)
                        return false
                    })
                })
            })
        })
    })
    var addtohome = addToHomescreen({
        autostart: false,
        modal: true,
        skipFirstVisit: true,
        maxDisplayCount: 2,
        startDelay: 0,
        debug: true
    });
    $("#add-to-homescreen-link").click(function(e){
        e.preventDefault()
        addtohome.show(true)
        return false;
    })
    $("#lit-link").click(function(e){
        $("#literature-review").slideToggle()
        e.preventDefault()
        return false;
    })
})