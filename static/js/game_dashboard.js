$(document).ready(function(){
    $('body').on('click', '.copy-game-link', function(){
        $('.copy-game-tooltip').html('Link copied')
        setTimeout(function(){
            $('.copy-game-tooltip').remove();
        }, 700);
    });
    var display_tooltip = false;
    $(document).on({
        mouseenter: function () {
            display_tooltip = true;
            var _this = this;
            setTimeout(function(){
                if (display_tooltip){
                    var t = _this.offsetTop;
                    var l = _this.offsetLeft;
                    //var h = parseInt($(_this).css('height').match('\\d+'));
                    $('body').append(`<div class='copy-game-tooltip'>Copy link</div>`);
                    //var _h1 = parseInt($('.copy-game-tooltip').css('height').match('\\d+'));
                    $('.copy-game-tooltip').css('top', t - 4);
                    $('.copy-game-tooltip').css('left', l+25);
                    
                }
            }, 500);
        },
        mouseleave: function () {
            display_tooltip = false;
            $('.copy-game-tooltip').remove();
        }
    }, ".copy-game-link"); 
});