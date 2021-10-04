$(document).ready(function(){
    $('body').on('click', '.game-content-close-top', function(){
        $('.game-content-modal').css('display', 'none');
    });
    $('body').on('click', '.close-content-modal', function(){
        $('.game-content-modal').css('display', 'none');
    });
    $('body').on('click', '.reaction-poll-option', function(){
        if (!$(this.parentNode).hasClass('reaction-poll-disabled')){
            $(this).addClass('reaction-poll-chosen')
            $(this.parentNode).addClass('reaction-poll-disabled')
        }
    });
});