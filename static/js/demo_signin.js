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
        $.ajax({
            url: "/add-content",
            type: "post",
            data: {payload: JSON.stringify(full_content_payload)},
            success: function(response) {
                if (response.status){
                    window.location.replace(`/content/${response.id}`)
                }
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }
    $('body').on('click', '.start-demo', function(){
        $('.start-demo').html(`
            <div class='start-demo-loading'>
                <div class='start-demo-col'><div class="la-ball-clip-rotate" style='color:white;height: 10px;width: 10px;margin-top: -11px;margin-right: 17px;'><div></div></div></div>
                <div class='start-demo-col'>
                    Starting demo...
                </div>
                <div class='start-demo-col'></div>
            </div>
        `);
        //start_demo();
    });
});