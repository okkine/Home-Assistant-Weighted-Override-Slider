# Home-Assistant-Weighted-Override-Slider

Automations are great, but sometimes you need to override it. Now you can do it with a simple slider. When set to 0, 

          input_entity: input_number.test_brightness
          output_entity: light.hue_bedroom_1
          color_entity: null
          name: Test Dimmer
          slider_min: -100
          slider_max: 100
          input_min: 0
          input_max: 100
          step: 1
          unit: "%"
          handle_color: # "#03a9f5" to match Home Assistant slider. Leave blank for default colors.
          handle_border_color: # "#03a9f5" to match Home Assistant slider. Leave blank for default colors.
          handle_shadow_color: # "#03a9f500" to match Home Assistant slider. Leave blank for default colors. Alpha added to eliminate shadow.
          slider_color: # "#03a9f5" to match Home Assistant slider. Leave blank for default colors.
          slider_background_color: # "#e7e0e8" to match Home Assistant slider. Leave blank for default colors.
