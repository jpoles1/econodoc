function initializeAutocompleteTextbox(data){
    $(".cost-input > .cost-input-box > input").each(function(_, entry){
        var btn = $(entry).siblings("button").first();
        var comboplete = new Awesomplete(entry, {
            minChars: 0,
            list: Object.keys(data)
        });
        $(btn).click(function() {
            if (comboplete.ul.childNodes.length === 0) {
                comboplete.minChars = 0;
                comboplete.evaluate();
            }   
            else if (comboplete.ul.hasAttribute('hidden')) {
                comboplete.open();
            }
            else {
                comboplete.close();
            }
        });
        Awesomplete.$(entry).addEventListener("awesomplete-selectcomplete", function(){
            inputValue = $(this).val()
            $(this).parents(".cost-input").children(".cost-value").html("$ " + data[inputValue].cost)
        })
    
    })
}

$(function(){
    var costData;
    $("#cost-list").append($("#cost-input-template").html())
    $.getJSON("labs.json", function(data){
        costData = data;
        initializeAutocompleteTextbox(costData)
    })
    $("#add-cost").click(function(){
        $("#cost-list").append($("#cost-input-template").html())
        initializeAutocompleteTextbox(costData)
        return false
    })
})
