# Home-Assistant-Weighted-Override-Slider

Allows users to effortlessly override any automated value (like brightness or color temperature) using a simple slider:

- Fully automatic mode (output matches input)
- 0 - 100: Output adjusts as a percentage between the input's automated value and its maximum.
- 0 to -100: Output adjusts as a percentage between the input's automated value and its minimum.

# Additional Features:

- Customizable color scheme
- Dynamic color matching (if a color_entity is provided):
  - If no color_entity is set or the light is off, the slider retains its configured colors.
  - If the light lacks color data, the slider defaults to orange.
  - If the color_entity is unavailable, the slider turns gray.
- Flexible slider range: Adjust min/max values for the slider.
- Input range control: Customize min/max values for the input.


# Installation:

Place a copy of the files into your www folder.

NOTE: When downloading, make sure to use the Raw button from each file's page.

After it has been downloaded you will need to restart Home Assistant, and clear the cache.

# Setup:


          input_entity: #Required
          output_entity: #Required
          color_entity: #Optional
          name: #Optional
          slider_min: #Default -100
          slider_max: #Default 100
          input_min: #Default 0
          input_max: #Default 100
          step: #Default 1
          unit: "%"
          dynamic_handle_color: #Default false. If true, The the center of the handle changes color with the light, and not just the border.
          handle_color: #Default #ffffff. 
          handle_border_color: #Default "#03a9f5"
          handle_shadow_color: #Default "#1c1c1c" 
          slider_color: #Default "#1c1c1c" 
          slider_background_color: #Default "#323232" 

### To approximate home assistant slider style, use the following:
          dynamic_handle_color: true
          handle_color: "#03a9f5" 
          handle_border_color:  "#03a9f5" 
          handle_shadow_color: "#03a9f500" 
          slider_color: "#03a9f5" 
          slider_background_color: "#e7e0e8"
