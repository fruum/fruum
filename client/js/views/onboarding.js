/******************************************************************************
Onboarding widget
*******************************************************************************/

/* globals Fruum */

(function() {
  'use strict';
  window.Fruum.require.push(function() {
    Fruum.views = Fruum.views || {};

    var $ = Fruum.libs.$,
        _ = Fruum.libs._,
        Backbone = Fruum.libs.Backbone;

    var MESSAGES = {
      breadcrumb: {
        tip: '<strong>Psst!</strong> You can use the breadcrumb to go back.',
        key: 1 << 1,
      },
      add_stream: {
        tip: 'Share your thoughts and ideas by clicking here.',
        key: 1 << 2,
      },
      add_category: {
        tip: '<strong>Psst!</strong> You can click here and add categories to organize your topics.',
        key: 1 << 3,
      },
      edit: {
        tip: '<strong>Hey!</strong> In case you want to edit your __type__ click here.',
        key: 1 << 4,
      },
      manage: {
        tip: '<strong>Hey!</strong> In case you want to manage this __type__ click here.',
        key: 1 << 5,
      },
      watch: {
        tip: '<strong>Hey!</strong> You&#39;re watching this __type__! You will receive notifications on updates.',
        key: 1 << 6,
      },
      preview: {
        tip: '<strong>Psst!</strong> Preview how your __type__ will look like by clicking this button.',
        key: 1 << 7,
      },
      attachments: {
        tip: 'An image is worth a thousand words, you can add some by clicking here.',
        key: 1 << 8,
      },
      help: {
        tip: '<strong>Hey!</strong> Enhance your messages with markdown typography, click to see how.',
        key: 1 << 9,
      },
    };

    Fruum.views.OnboardingView = Backbone.View.extend({
      events: {
        'click .fruum-js-onboarding-ok': 'onOK',
      },
      show_delay: 2000,
      hide_delay: 9000,
      anim_yoffset: 35,
      initialize: function(options) {
        _.bindAll(this, 'consume', 'hide');
        this.ui_state = options.ui_state;
        this.root_el = options.root_el;
        this.template_top = _.template($('#fruum-template-onboarding-top').html());
        this.template_bottom = _.template($('#fruum-template-onboarding-bottom').html());
        this.listenTo(Fruum.io, 'fruum:set_onboard', this.addMessage);
        this.listenTo(Fruum.io, 'fruum:unset_onboard', this.removeMessage);
        this.listenTo(this.ui_state, 'change:searching', function() {
          if (this.ui_state.get('searching')) Fruum.io.trigger('fruum:set_onboard');
        });
        this.listenTo(this.ui_state, 'change:loading', function() {
          Fruum.io.trigger('fruum:set_onboard');
        });
        this.queue = [];
        this.delay_offset = 0;
        this.noop = true;
      },
      removeMessage: function(message) {
        if (Fruum.user.anonymous) return;
        if (message && MESSAGES[message] && !(Fruum.user.onboard & MESSAGES[message].key)) {
          Fruum.user.onboard |= MESSAGES[message].key;
          Fruum.io.trigger('fruum:onboard', { onboard: Fruum.user.onboard });
          if (this.viewing == message) {
            if (this.timer_hide) clearTimeout(this.timer_hide);
            this.hide();
          }
        }
      },
      addMessage: function(message) {
        if (Fruum.user.anonymous) return;
        if (!message) {
          // purge all
          this.queue = [];
          this.delay_offset = 0;
          if (this.timer_show) {
            clearTimeout(this.timer_show);
            this.timer_show = null;
          }
          if (this.timer_hide) {
            clearTimeout(this.timer_hide);
            this.timer_hide = null;
          }
          this.hide();
          return;
        }
        if (this.queue.indexOf(message) < 0 && this.validate(message)) {
          this.queue.push(message);
          if (!this.timer_show && !this.viewing) {
            this.timer_show = setTimeout(this.consume, this.show_delay + this.delay_offset);
          }
        }
      },
      validate: function(message) {
        return message &&
            MESSAGES[message] &&
            !(Fruum.user.onboard & MESSAGES[message].key) &&
            this.root_el.find('[data-onboard="' + message + '"]').length;
      },
      hide: function() {
        this.timer_hide = null;
        this.noop = true;
        if (!this.$el) return;
        var that = this;
        this.$el.fadeOut(200, function() {
          that.$el.remove();
          that.undelegateEvents();
          that.$el = null;
          that.viewing = null;
          // consume next
          if (that.queue.length) {
            if (that.timer_show) clearTimeout(that.timer_show);
            that.timer_show = setTimeout(that.consume, that.show_delay + that.delay_offset);
          }
        });
      },
      consume: function() {
        this.timer_show = null;
        while (this.queue.length) {
          var message = this.queue.shift();
          if (this.validate(message)) {
            this.viewing = message;
            this.noop = true;

            var target = this.root_el.find('[data-onboard="' + message + '"]').eq(0),
                target_top = target.offset().top - this.root_el.offset().top,
                target_center = target.offset().left - this.root_el.offset().left +
                                target.innerWidth() / 2,
                anim = { opacity: 1 },
                tip = MESSAGES[message].tip,
                that = this;

            tip = tip.replace('__type__', this.ui_state.get('viewing').type || 'message');

            if (target_top < this.root_el.height() / 2) {
              var top = target_top + target.height();
              anim.top = top + 'px';
              this.root_el.append(this.template_top({
                left: target_center,
                top: top + this.anim_yoffset,
                tip: tip,
              }));
            } else {
              var bottom = this.root_el.height() - target_top;
              anim.bottom = bottom + 'px';
              this.root_el.append(this.template_bottom({
                left: target_center,
                bottom: bottom + this.anim_yoffset,
                tip: tip,
              }));
            }

            this.$el = this.root_el.find('.fruum-onboarding');
            this.delegateEvents();
            this.$el.animate(anim, 400, 'easeInOutBack', function() {
              that.noop = false;
              that.delay_offset += that.show_delay;
            });
            this.timer_hide = setTimeout(this.hide, this.hide_delay);
            return;
          }
        }
      },
      onOK: function(event) {
        if (event) {
          event.preventDefault();
          event.stopPropagation();
        }
        if (this.viewing && !this.noop) {
          Fruum.user.onboard |= MESSAGES[this.viewing].key;
          if (this.timer_hide) clearTimeout(this.timer_hide);
          this.hide();
          Fruum.io.trigger('fruum:onboard', { onboard: Fruum.user.onboard });
        }
      },
    });
  });
})();
