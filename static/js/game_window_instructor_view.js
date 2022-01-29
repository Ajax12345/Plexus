$(document).ready(function(){
    var meta_payload = null;
    var game_payload = null;
    var user_payload = null;
    var content_payload = null;
    var matrix_payload = null;
    var gameplay_payload = null;
    $('.score-box-divider').css('height', $("#score-col-main").css('height'));
    function load_start(){
        meta_payload = $('.main').data('pld')
        $.ajax({
            url: "/load-game-instance-instructor",
            type: "post",
            data: {payload: JSON.stringify(meta_payload)},
            success: function(response) {
                var payload = JSON.parse(response.payload);
                console.log(payload)
                game_payload = payload.game;
                user_payload = payload.user;
                content_payload = payload.content;
                matrix_payload = payload.matrix;
                gameplay_payload = payload.gameplay;
                if (gameplay_payload.id === null){
                    //setup waitinglist
                }
                else{
                    //setup current game state
                }
            },
            error: function(xhr) {
                //Do Something to handle error
            }
        });
    }
    load_start();
});