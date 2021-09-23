$(document).ready(function(){
    $('body').on('input', '.access-demo-field', function(){
        $(this).removeClass('access-demo-field-error')
    }); 
    function start_demo(){
        var _payload = {}
        for (var i of document.querySelectorAll('.access-demo-field')){
            if ($(i).val().length === 0){
                $(i).addClass('access-demo-field-error');
                return;
            }
            _payload[$(i).data('field')] = $(i).val();
        }
    }
    $('body').on('click', '.start-demo', function(){
        start_demo();
    });
});