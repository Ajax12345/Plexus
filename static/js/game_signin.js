$(document).ready(function(){
    $('body').on('input', '.enter-game-field', function(){
        $(this).removeClass('enter-game-field-error')
    }); 
    function enter_game(){
        var _payload = {}
        for (var i of document.querySelectorAll('.enter-game-field')){
            if ($(i).val().length === 0){
                $(i).addClass('enter-game-field-error');
                $('.enter-game').html(`Enter Game`)
                return;
            }
            _payload[$(i).data('field')] = $(i).val();
        }
        var gid = parseInt($('.game-enter-outer').data('gid'));
        $.ajax({
            url: "/add-invitee",
            type: "post",
            data: {payload: JSON.stringify({..._payload, gid:gid})},
            success: function(response) {
                //window.location.replace(`/play/demo/${gid}?uid=${response.id}`);
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });

    }
    $('body').on('click', '.enter-game', function(){
        $('.enter-game').html(`
            <div class='enter-game-loading'>
                <div class='enter-game-col'><div class="la-ball-clip-rotate" style='color:white;height: 10px;width: 10px;margin-top: -11px;margin-right: 17px;'><div></div></div></div>
                <div class='enter-game-col'>
                    Entering game...
                </div>
                <div class='enter-game-col'></div>
            </div>
        `);
        //enter_game();
    });
});