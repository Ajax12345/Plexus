$(document).ready(function(){
    $('body').on('input', '.access-demo-field', function(){
        $(this).removeClass('access-demo-field-error')
    }); 
    function start_demo(){
        var _payload = {}
        for (var i of document.querySelectorAll('.access-demo-field')){
            if ($(i).val().length === 0){
                $(i).addClass('access-demo-field-error');
                $('.start-demo').html(`Start demo`)
                return;
            }
            _payload[$(i).data('field')] = $(i).val();
        }
        $.ajax({
            url: "/add-invitee",
            type: "post",
            data: {payload: JSON.stringify({..._payload, gid:parseInt($('.demo-access-outer').data('gid'))})},
            success: function(response) {
                alert(`added (${response.id})`);
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
        start_demo();
    });
});