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
    $('body').on('click', '.nav-entry', function(){
        if (!$(this).hasClass('nav-entry-selected')){
            $('.nav-entry').each(function(){
                $(this).removeClass('nav-entry-selected');
            });
            $(this).addClass('nav-entry-selected');
        }
    });
    $(document).on({
        mouseenter: function () {
            
            var t = this.offsetTop;
            var l = this.offsetLeft;
            var h = parseInt($(this).css('height').match('\\d+'));
            $('body').append(`<div class='about-block-tooltip'>${$(this).data('tooltip')}</div>`);
            var h1 = parseInt($('.about-block-tooltip').css('height').match('\\d+'));
            $('.about-block-tooltip').css('top', t-(h1-h)/2);
            $('.about-block-tooltip').css('left', l+25);
                
        },
        mouseleave: function () {
            $('.about-block-tooltip').remove();
        }
    }, ".tooltip-info"); 
});