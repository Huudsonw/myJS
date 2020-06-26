var x;
var captured = 0;
var redeemDateTime = new Date();
var isRedeemed = false;
var isRedeeming = false;
var QrcodeEnabled = false;
var ver = iOSversion();
var clicked_status = false;
// -------- Feedback -------- //
var FeedbackEnabled = false;
var feedback = '';
var feedback_on_redeem = false;

// -------- Refer a friend -------- //
var RAFEnabled = false;
var GotRAF = false
var RAFJson;
var num_referrals_to_reward = 0;
var shareSMSMsg = "";
var shareFBMsg = "";
var shareTwitterMsg = "";
var shareRedirectTimeout = null;
var fb_post_done = false;

// -------- Location snapshot -------- //
var device = {};
var network = '';
var user_agent_string = '';
var browser_cookies_enabled = null;
var browser_online = null;

// -------- Document ready -------- //

$(document).ready(function(){

    if (check_cookie_support_and_redirect()) return;

    x = document.getElementById("geo_location");

    RAFEnabled = $('#refer').text() == 'true';
    QrcodeEnabled = $('#qr_enabled').text() != ''
    FeedbackEnabled = $('#feedback_enabled').text() == 'true';

    //x.innerHTML="this is ...";
    getUserAgent();
    getLocation();

    // Set up landing and redeem images
    displayImages();

    // Set up height matching columns
    $(function() {
        $('.columnHeightMatch').matchHeight();
    });

    // Set up qrcode elements
    if (QrcodeEnabled) {
        $('#qrcode-img').qrcode({width: 150, height: 150, text: $('#qr_code').text()});
        $('#redeem-qrcode-page').show();

        // Immediate redemption when qrcode is displayed
        redeemCoupon();
    }
    else {
        $('#init-page').show();
    }

    // Coupon has RAF enabled
    if (RAFEnabled === true) {
        $(".refer-button-container").show();
        $(".referFinePrint").show();
    }
    // Coupon has expiration_date
    if ($('#expiration_date').text() != '.') {
        $('#expiration_date').show();
    }
    // Coupon countdown time
    if ($('#CountDownTime').text() == '1') {
        $('#minutes').text('minute');
    } else {
        $('#minutes').text('minutes');
    }

    // Button clicks
    $("#redeem-button").click(function(){
        var document_height = $(document).height();
        $('#dialog-redeem .modal-body').css('max-height', document_height*0.50);
    });
    $("#dialog-redeem-confirm-button").click(function(){
        redeemCoupon();
    });
    $(".referButton").click(function(){
        if (GotRAF !== true) {
            ret = setupRAFDashboard();
            if ( ret == 1 ) {
                showRAFDashboard();
            }
        } else {
            showRAFDashboard();
        }
    });
    $("#return-button").click(function(){
        if (isRedeeming || isRedeemed) {
            showredeemed();
        }
        else {
            showlanding();
        }
    });

    if (FeedbackEnabled) {

        feedback = $('#feedback').text();

        if (feedback == 'Like')  {
            $("#feedback-like-button").removeClass('muted');
            $("#feedback-dislike-button").addClass('muted');
        } else if (feedback == 'Dislike') {
            $("#feedback-dislike-button").removeClass('muted');
            $("#feedback-like-button").addClass('muted');
        }

        $('#feedback-container').show();

        $("#feedback-like-button").click(function(){
            if (!$("#feedback-like-button").hasClass('muted') && $("#feedback-dislike-button").hasClass('muted')) {
                $("#feedback-like-button").removeClass('muted');
                $("#feedback-dislike-button").removeClass('muted');
                saveFeedback('');
            } else {
                $("#feedback-like-button").removeClass('muted');
                $("#feedback-dislike-button").addClass('muted');
                saveFeedback('Like');
            }
        });

        $("#feedback-dislike-button").click(function(){
            if (!$("#feedback-dislike-button").hasClass('muted') && $("#feedback-like-button").hasClass('muted')) {
                $("#feedback-dislike-button").removeClass('muted');
                $("#feedback-like-button").removeClass('muted');
                saveFeedback('');
            } else {
                $("#feedback-dislike-button").removeClass('muted');
                $("#feedback-like-button").addClass('muted');
                saveFeedback('Dislike');
            }
        });
    }

});

// -------- Display Optional Images -------- //

function displayImages() {

    if ($('#img_landing').attr('src') != '') {
        $('#img-landing-container').show();
    }
    if ($('#img_redeem').attr('src') != '') {
        $('#img-redeem-container').show();
    }

}

// -------- Feedback -------- //

function saveFeedback(value) {

    if (isRedeeming || isRedeemed) {
        feedback_on_redeem = true;
    }

    var promo_code = $('#sid').text();
    var actionUrl = '/promofeedback?promo_code='+promo_code+'&feedback='+value;

    $.ajax({
    url: actionUrl,
    type: 'GET',
    async: true,
    cache: false,
    timeout: 30000,
        error: function(){
            return true;
        },
        success: function(msg){
            $('#feedback').text(msg);
            return true;
        }
    });

}

// -------- User agent -------- //

function getUserAgent() {

    device = (function() {
        var ua = navigator.userAgent;
        var checker = {
          iphone: ua.match(/(iPhone|iPod|iPad)/),
          blackberry: ua.match(/BlackBerry/),
          android: ua.match(/Android/)
        };

        return {
            isAndroid : checker.android,
            isiOS : checker.iphone,
            isBlackberry : checker.blackberry
        };
    })();

    user_agent_string = navigator.userAgent;
    browser_cookies_enabled = navigator.cookieEnabled;
    browser_online = navigator.onLine;

    if (navigator.connection) {
        network = navigator.connection.type;
    }

}

// -------- Location -------- //

function saveLocation(location_captured, caching, high_acc, acc) {

    var promo_code = $('#sid').text();
    var geo_location = location_captured;
    var device_name = (function() {
        if (device.isiOS) return 'ios';
        else if (device.isAndroid) return 'android';
        else if (device.isBlackberry) return 'blackberry';
        else return 'unidentified';
    })();

    var actionUrl = '/promolocation';
        var data_post = {
        promo_code: promo_code,
        geo_location: geo_location,
        geo_location_caching: caching,
        geo_location_high_accuracy: high_acc,
        geo_location_accuracy: acc,
        device: device_name,
        network: network,
        user_agent_string: user_agent_string,
        browser_cookies_enabled: browser_cookies_enabled,
        browser_online: browser_online
    };

    captured = 1;

    $.ajax({
    url: actionUrl,
    type: 'POST',
    data: data_post,
    async: true,
    cache: false,
    timeout: 30000,
        error: function(){
            return true;
        },
        success: function(msg){
            $('#geo_location_result').text(msg);
            return true;
        }
    });

}

function showPosition(position) {
    x.innerHTML = position.coords.latitude + "," + position.coords.longitude;

    if (captured == 0) {
        var caching = false;    // temp hack
        var high_acc = true;    // temp hack
        saveLocation(position.coords.latitude + "," + position.coords.longitude, caching, high_acc, position.coords.accuracy);
    }
}

function locationFail() {
    x.innerHTML = "0,0";

    if (captured == 0) {
        var caching = false;    // temp hack
        var high_acc = false;    // temp hack
        saveLocation("0,0", caching, high_acc, "Infinity");
    }
}

function getLocation() {

    if (navigator.geolocation) {

        var options = {
            timeout: Infinity, // default
            enableHighAccuracy: true,
            maximumAge: 0 // default // OR caching ? 300000 : 0 // 5 minutes
        };

        navigator.geolocation.getCurrentPosition(showPosition, locationFail, options);

    } else {
        x.innerHTML = "0,0";
    }
}

// -------- Redemption -------- //

function showlanding() {

    $("#refer-text").hide();
    $("#refer-dashboard-page").hide();

    $('.raf-zone1').addClass('zone1').removeClass('raf-zone1');
    $('.raf-zone2').addClass('zone2').removeClass('raf-zone2');
    $('.raf-zone3').addClass('zone3').removeClass('raf-zone3');

    $("#main-legal").show();
    $('#init-page').show();
    $("#offer-text").show();
    $(".refer-button-container").show();

    if ($('#no-longer-valid-text').length) {
        $('#redeem-page').show();
    }

    // Show the Feedback Buttons if not clicked
    // Show the Feedback Buttons if clicked on Redeem Page
    if (FeedbackEnabled) {
        $('#feedback-container').show();
    }

}

function showredeemed() {

    $("#refer-text").hide();
    $("#refer-dashboard-page").hide();

    $('.raf-zone1').addClass('zone1').removeClass('raf-zone1');
    $('.raf-zone2').addClass('zone2').removeClass('raf-zone2');
    $('.raf-zone3').addClass('zone3').removeClass('raf-zone3');

    if (QrcodeEnabled){
        $("#main-legal").show();
        $("#redeem-qrcode-page").show();
    }
    else {
        $("#redeem-page").show();
        if (isRedeemed) { showexpired(); }
    }

    $("#redeem-legal").show();
    $("#offer-text").show();
    $(".refer-button-container").show();

    // Show the Feedback Buttons if not clicked
    // Show the Feedback Buttons if clicked on Redeem Page
    if (FeedbackEnabled && (($('#feedback').text() != 'Like' && $('#feedback').text() != 'Dislike') || feedback_on_redeem)) {
        $('#feedback-container').show();
    }
}

function showexpired() {
    var d = redeemDateTime;
    var day = ("0"+d.getDate()).slice(-2);
    var month = ("0"+(d.getMonth() + 1)).slice(-2);
    var y = ("0"+d.getFullYear()).slice(-2);
    var h = d.getHours();
    var m = d.getMinutes();
    var suffix = "AM";

    if (h == 12) {
        suffix = "PM";
    }
    if (h > 12) {
        suffix = "PM";
        h = h - 12;
    }

    $("#redeem-datetime").html(month + "/" + day + "/" + y + " at " + ('0'+h).slice(-2) + ":" + ('0'+m).slice(-2) + " " + suffix + ".");
    $(".countdownExpiredBefore").hide();
    $(".countdownExpiredAfter").show();
}

function redeemCoupon() {
    var redeem = $('#sid').text();
    var location = $('#geo_location').text();

    var data_post = {
        promo: redeem,
        location : location,
        qr_redeemed : QrcodeEnabled
    };

    redeemOffer(data_post);

    var result = $('#redeem_result').text();
    var check_result = result.split(",");
    var check = check_result[0];

    if (check == 'true') {
        $('#dialog-error').modal('show');
    } else {
        // Hides the Redeem Button After Click
	    $("#init-page").hide();

	    // Hide the Feedback Buttons if already clicked
	    if ($('#feedback').text() == 'Like' || $('#feedback').text() == 'Dislike') {
	        $('#feedback-container').hide();
	    }

        // Redeem legal
        $("#redeem-legal").show();

	    // Redeem date
        var d = redeemDateTime;
        var day = ("0"+d.getDate()).slice(-2);
        var month = ("0"+(d.getMonth() + 1)).slice(-2);
        var y = ("0"+d.getFullYear()).slice(-2);
	    $("#redeem-date").html(month + "/" + day + "/" + y)

        if (QrcodeEnabled) {

            isRedeeming = false;
            isRedeemed = true;

            //redeemDateTime = new Date();
            //showexpired();
        }
        else {
            // Hides main legal after click
            $("#main-legal").hide();

            // Countdown Timer
            $("#redeem-page").show();
            var countdownTime = $('#CountDownTime').text();

			if (parseInt(countdownTime) > 60) {
				$('.c-text').css("font-size","20px");
			}

            var countdown = new Countdown({minutes: countdownTime, seconds: 00}, $(".c-container"));

            isRedeeming = true;

            // Random Code
            if ($('#redeem_random_code').text() != '') {
                $('#redeem-random-code-container').show();
            }
            // Optional Text
            if ($('#redeem_optional_text').text() != '') {
                $('#redeem-optional-text-container').show();
            }
        }
    }
}

function redeemOffer(data_post) {

    var actionUrl = '/promoredeem'

    $.ajax({
        url: actionUrl,
        type: 'POST',
        data: data_post,
        async: false,
        cache: false,
        timeout: 30000,
            error: function(){
                $('#redeem_result').text('false,');
                return true;
            },
            success: function(msg){
                $('#redeem_result').text(msg);
                return true;
            }
        });
}

// -------- Refer a friend -------- //

function getRAFConfig() {

    var promo_code = $('#sid').text();
    var promo_id = $('#promo_id').text();   // SMAPI-228 Preview
    var company_id = $('#company_id').text();   // SMAPI-228 Preview
    var actionUrl = $('#rafworker_service_url').text() + '/promoraf/getraf';
    var data_post = {
        promo_code : promo_code,
        promo_id: promo_id,
        company_id: company_id
    };

    $.ajax({
    url: actionUrl,
    type: 'POST',
    data: data_post,
    async: false,
    cache: false,
    timeout: 30000,
        error: function(){
            $('#raf_result').text('KO');;
            return true;
        },
        success: function(msg){
            RAFJson = msg;
            $('#raf_result').text('OK');
            return true;
        }
    });
}

function setupRAFDashboard() {



    var ret = 0;
    getRAFConfig();
    console.log(RAFJson);

    if ($('#raf_result').text() == 'OK') {
        try{
            //result_json = jQuery.parseJSON(RAFJson);
            result_json = RAFJson;
            ret = 1;
            // console.log(result_json)
        } catch(err) {
            console.log ('setupRAFDashboard() ' + err);
        }
    }

    if (ret == 1 && result_json.result) {

        $('#sms_share_message').text(result_json.sms_share_message);
        shareSMSMsg = result_json.sms_share_message;

        if (result_json.fb_share_message == '') {
            shareFBMsg = shareSMSMsg;
        } else {
            $('#fb_share_message').text(result_json.fb_share_message);
            shareFBMsg = result_json.fb_share_message;
        }

        if (result_json.twitter_share_message =='') {
            shareTwitterMsg = shareSMSMsg;
        } else {
            $('#twitter_share_message').text(result_json.twitter_share_message);
            shareTwitterMsg = result_json.twitter_share_message;
        }

        num_referrals_to_reward = result_json.num_referrals_to_reward;
        shareSMSMsg += ' ' + result_json.share_url + ' .' ;
        shareFBMsg += ' ' + result_json.share_url;
        shareTwitterMsg += ' ' + result_json.share_url;

        $('#num_referrals_to_next_reward').text(result_json.num_referrals_to_next_reward);

        if (result_json.num_referrals_to_next_reward == '1') {
            $('#friends').text('friend');
        } else {
            $('#friends').text('friends');
        }

        $('#call_to_action_begin').text(result_json.call_to_action_begin);
        $('#call_to_action_end').text(result_json.call_to_action_end);
        $('#raf_footer_legal').text(result_json.raf_footer_legal);
        $('#raf_header_text').text(result_json.raf_header_text);
        $('#raf_header_legal').text(result_json.raf_header_legal);
        $('#fb_share_url').text(result_json.fb_share_url);
        $('#share_url').text(result_json.share_url);
        $('#share_img').text(result_json.share_img);
        $('#progress_bar_text').text(result_json.progress_bar_text);
        $('#raf_encoded').text(result_json.encoded); // TODO

        progress_bar_percentage = result_json.progress_bar_percentage;
        $('.progress').css('width',progress_bar_percentage+'%');

        if (progress_bar_percentage == '0') {
            $('.progress').css("float","none");
        } else {
            $('.progress').css("float","left");
            $('#progress-bar-container').show();
        }

		GotRAF = true;
    } else{
	    $('#dialog-error').modal('show');
	    ret = 0;
    }

    return ret;
}

function showRAFDashboard() {

    if (QrcodeEnabled) {
        // $("#main-legal").hide();
        $("#redeem-qrcode-page").hide();
    }

    $("#main-legal").hide();
    $('#init-page').hide();

    $("#redeem-page").hide();
    $("#redeem-legal").hide();
    $(".refer-button-container").hide();
    $("#offer-text").hide();
    $("#feedback-container").hide();

    $('.zone1').addClass('raf-zone1').removeClass('zone1');
    $('.zone2').addClass('raf-zone2').removeClass('zone2');
    $('.zone3').addClass('raf-zone3').removeClass('zone3');

    $("#refer-text").show();
    $("#refer-dashboard-page").show();
}

// -------- Refer a friend (Share) -------- //

function iOSversion() {
    if (/iP(hone|od|ad)/.test(navigator.platform)) {
        // supports iOS 2.0 and later: <http://bit.ly/TJjs1V>
        var v = (navigator.appVersion).match(/OS (\d+)_(\d+)_?(\d+)?/);
        return [parseInt(v[1], 10), parseInt(v[2], 10), parseInt(v[3] || 0, 10)];
    }
}

function log_share_action(action, post_id) {
    var raf_encoded = $('#raf_encoded').text();
    var data_post = { 'encoded' : raf_encoded, 'action': action, 'post_id':post_id};
    var actionUrl = $('#rafworker_service_url').text() + '/promoraf/logshare';

    $.ajax({
        url: actionUrl,
        type: 'POST',
        data: data_post,
        async: true,
        cache: false,
        timeout: 30000,
            error: function(){
                // $('#Achivements').text('false,');
                console.log('Error calling log_share_action()')
                return true;
            },
            success: function(msg){
                // $('#Achivements').text(msg);
                console.log(msg)
                return true;
            }
        });
}

function sendSMSMsg() {

    if (ver == undefined){ //not iOS
        if (device.isAndroid){
            window.location.href = "sms:?body="+ androidEncode(shareSMSMsg);
        }
        else{
            window.location.href = "sms:?body="+ encode(shareSMSMsg);
        }
    }
    else{
        if (ver[0] < 8 ){ //body will populate on older versions 5,6 but not in 7
            window.location.href = "sms:;body="+ encode(shareSMSMsg);
        }
        else{ //body will populate only on version 8 or above
            window.location.href = "sms:&body="+ encode(shareSMSMsg);
        }
    }

    log_share_action('sms_click', '');
}

function sendFacebookMsg() {
    if (fb_post_done) {
        return true;
    } else {

        // $('#fb_share_url').text(result_json.fb_share_url);
        var ogShareUrl = $('#fb_share_url').text();
        var ogShareMsg = shareFBMsg;
        var ogShareImg = $('#share_img').text();
        var callback = log_share_action;

        fb_post_done = shareFacebookOpenGraphObject(ogShareUrl, ogShareMsg, ogShareImg, callback);
    }

}

function sendTwitterMsg() {

//    var now = new Date().valueOf();
//
//    setTimeout(function () {
//        if (new Date().valueOf() - now > 100) return;
//        window.location.href = "https://twitter.com/intent/tweet?text=" + encode(shareTwitterMsg);
//    }, 25);
//
//    window.location.href = "twitter://post?message=" + encode(shareTwitterMsg);

    function preventPopup() {
        clearTimeout(shareRedirectTimeout);
        shareRedirectTimeout = null;
        window.removeEventListener('pagehide', preventPopup);
    }

    $('<iframe />')
    .attr('src', "twitter://post?message=" + encode(shareTwitterMsg))
    .attr('style', 'display:none;')
    .appendTo('body');

    shareRedirectTimeout = setTimeout(function() {
        window.location.href = "https://twitter.com/intent/tweet?text=" + encode(shareTwitterMsg);
    }, 25);
    window.addEventListener('pagehide', preventPopup);

    log_share_action('twitter_click', '');

}

function androidEncode(msg) {
    msg = msg.replace('&','and');
    return encode(msg);
}

function encode(msg) {
    msg = encodeURIComponent(msg);
    return msg;
}

// -------- New Template (Timer) -------- //

function centerModals(a) {
    var b;
    b = a.length ? a : $(modalVerticalCenterClass + ":visible"), b.each(function(a) {
        var b = $(this).clone().css("display", "block").appendTo("body"),
            c = Math.round((b.height() - b.find(".modal-content").height()) / 2);
        c = c > 0 ? c : 0, b.remove(), $(this).find(".modal-content").css("margin-top", c)
    })
}

function _classCallCheck(a, b) {
    if (!(a instanceof b)) throw new TypeError("Cannot call a class as a function")
}

var modalVerticalCenterClass = ".modal";
$(modalVerticalCenterClass).on("show.bs.modal", function(a) {
    centerModals($(this))
}), $(window).on("resize", centerModals);

var Util = function() {
        function a() {
            _classCallCheck(this, a)
        }
        return a.convertMS = function(a) {
            var b, c, d, e;
            return e = Math.floor(a / 1e3), d = Math.floor(e / 60), e %= 60, c = Math.floor(d / 60), d %= 60, b = Math.floor(c / 24), c %= 24, {
                d: b,
                h: c,
                m: d,
                s: e
            }
        }, a.addZ = function(a) {
            return 0 === a ? "00" : a ? (10 > a ? "0" : "") + a : "0"
        }, a.formatTime = function(b) {
            return b.d > 0 ? a.addZ(b.d) + "D " + a.addZ(b.h) + "H" : b.h > 0 ? a.addZ(b.h) + "H " + a.addZ(b.m) + "M" : a.addZ(b.m) + ":" + a.addZ(b.s)
        }, a
    }(),
    Countdown = function() {
        function a(b, c) {
            _classCallCheck(this, a), this.now = moment(), this.end = moment().add(b), this.diff = this.end.diff(this.now), this.$el = c, this.svg = Snap(this.$el.find("svg")[0]), this.progress = this.svg.select("#progress"), this.$txt = this.$el.find(".c-text"), this.initCircle(), this.initTimer()
        }
        return a.prototype.initCircle = function() {
            var a = this;
            a.progress.attr({
                strokeDasharray: "0, 301.44"
            }), Snap.animate(0, 301.44, function(b) {
                a.progress.attr({
                    "stroke-dasharray": b + ", 301.44"
                })
            }, a.diff)
        }, a.prototype.initTimer = function() {
            var a = this;
            a.timer = setInterval(function() {
                a.now = moment(), a.diff = a.end.diff(a.now), a.diff > 0 ? a.$txt.text(Util.formatTime(Util.convertMS(a.diff))) : (a.$txt.text("0:00"), clearInterval(a.timer), isRedeeming = false, isRedeemed = true, redeemDateTime = new Date(), showexpired())
            }, 200)
        }, a
    }();
! function(a) {
    "use strict";
    "function" == typeof define && define.amd ? define(["jquery"], a) : "undefined" != typeof module && module.exports ? module.exports = a(require("jquery")) : a(jQuery)
}(function(a) {
    var b = -1,
        c = -1,
        d = function(a) {
            return parseFloat(a) || 0
        },
        e = function(b) {
            var c = 1,
                e = a(b),
                f = null,
                g = [];
            return e.each(function() {
                var b = a(this),
                    e = b.offset().top - d(b.css("margin-top")),
                    h = g.length > 0 ? g[g.length - 1] : null;
                null === h ? g.push(b) : Math.floor(Math.abs(f - e)) <= c ? g[g.length - 1] = h.add(b) : g.push(b), f = e
            }), g
        },
        f = function(b) {
            var c = {
                byRow: !0,
                property: "height",
                target: null,
                remove: !1
            };
            return "object" == typeof b ? a.extend(c, b) : ("boolean" == typeof b ? c.byRow = b : "remove" === b && (c.remove = !0), c)
        },
        g = a.fn.matchHeight = function(b) {
            var c = f(b);
            if (c.remove) {
                var d = this;
                return this.css(c.property, ""), a.each(g._groups, function(a, b) {
                    b.elements = b.elements.not(d)
                }), this
            }
            return this.length <= 1 && !c.target ? this : (g._groups.push({
                elements: this,
                options: c
            }), g._apply(this, c), this)
        };
    g.version = "master", g._groups = [], g._throttle = 80, g._maintainScroll = !1, g._beforeUpdate = null, g._afterUpdate = null, g._rows = e, g._parse = d, g._parseOptions = f, g._apply = function(b, c) {
        var h = f(c),
            i = a(b),
            j = [i],
            k = a(window).scrollTop(),
            l = a("html").outerHeight(!0),
            m = i.parents().filter(":hidden");
        return m.each(function() {
            var b = a(this);
            b.data("style-cache", b.attr("style"))
        }), m.css("display", "block"), h.byRow && !h.target && (i.each(function() {
            var b = a(this),
                c = b.css("display");
            "inline-block" !== c && "flex" !== c && "inline-flex" !== c && (c = "block"), b.data("style-cache", b.attr("style")), b.css({
                display: c,
                "padding-top": "0",
                "padding-bottom": "0",
                "margin-top": "0",
                "margin-bottom": "0",
                "border-top-width": "0",
                "border-bottom-width": "0",
                height: "100px",
                overflow: "hidden"
            })
        }), j = e(i), i.each(function() {
            var b = a(this);
            b.attr("style", b.data("style-cache") || "")
        })), a.each(j, function(b, c) {
            var e = a(c),
                f = 0;
            if (h.target) f = h.target.outerHeight(!1);
            else {
                if (h.byRow && e.length <= 1) return void e.css(h.property, "");
                e.each(function() {
                    var b = a(this),
                        c = b.attr("style"),
                        d = b.css("display");
                    "inline-block" !== d && "flex" !== d && "inline-flex" !== d && (d = "block");
                    var e = {
                        display: d
                    };
                    e[h.property] = "", b.css(e), b.outerHeight(!1) > f && (f = b.outerHeight(!1)), c ? b.attr("style", c) : b.css("display", "")
                })
            }
            e.each(function() {
                var b = a(this),
                    c = 0;
                h.target && b.is(h.target) || ("border-box" !== b.css("box-sizing") && (c += d(b.css("border-top-width")) + d(b.css("border-bottom-width")), c += d(b.css("padding-top")) + d(b.css("padding-bottom"))), b.css(h.property, f - c + "px"))
            })
        }), m.each(function() {
            var b = a(this);
            b.attr("style", b.data("style-cache") || null)
        }), g._maintainScroll && a(window).scrollTop(k / l * a("html").outerHeight(!0)), this
    }, g._applyDataApi = function() {
        var b = {};
        a("[data-match-height], [data-mh]").each(function() {
            var c = a(this),
                d = c.attr("data-mh") || c.attr("data-match-height");
            d in b ? b[d] = b[d].add(c) : b[d] = c
        }), a.each(b, function() {
            this.matchHeight(!0)
        })
    };
    var h = function(b) {
        g._beforeUpdate && g._beforeUpdate(b, g._groups), a.each(g._groups, function() {
            g._apply(this.elements, this.options)
        }), g._afterUpdate && g._afterUpdate(b, g._groups)
    };
    g._update = function(d, e) {
        if (e && "resize" === e.type) {
            var f = a(window).width();
            if (f === b) return;
            b = f
        }
        d ? -1 === c && (c = setTimeout(function() {
            h(e), c = -1
        }, g._throttle)) : h(e)
    }, a(g._applyDataApi), a(window).bind("load", function(a) {
        g._update(!1, a)
    }), a(window).bind("resize orientationchange", function(a) {
        g._update(!0, a)
    })
});
