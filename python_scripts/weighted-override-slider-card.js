class WeightedOverrideSliderCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._updateTimeout = null;
    this.isUpdating = false;
    this.currentSliderValue = 0;
  }

  setConfig(config) {
    if (!config.output_entity) throw new Error("You need to define 'output_entity'");
    if (!config.input_entity) throw new Error("You need to define 'input_entity'");
    this.config = config;
    this.isLightEntity = config.output_entity.startsWith('light.');
    this.currentSliderValue = config.initial_slider_value || 0;
  }

  connectedCallback() {
    this.render();
  }

  set hass(hass) {
    this._hass = hass;
    clearTimeout(this._updateTimeout);
    this._updateTimeout = setTimeout(() => {
      if (this.shadowRoot && !this.isUpdating) this.render();
    }, 500);
  }

  getLightColor() {
    // 1. Default to slider_color if no color_entity specified
    if (!this.config.color_entity) return this.config.slider_color || '#4473a0';
    
    // 2. Get the color entity state
    const colorState = this._hass.states[this.config.color_entity];
    
    // 3. Grey if color entity unavailable
    if (!colorState || colorState.state === 'unavailable') return '#808080';
    
    // 4. Use slider_color (or default) if light is off
    if (colorState.state === 'off') return this.config.slider_color || '#4473a0';
    
    // 5. Calculate brightness (0-255 → 0.5-1.0 range)
    const brightness = colorState.attributes.brightness 
      ? 0.5 + (colorState.attributes.brightness / 255) / 2
      : 1;
    
    // 6. Check for color attributes
    if (colorState.attributes.rgb_color) {
      const [r, g, b] = colorState.attributes.rgb_color;
      return `rgb(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(b * brightness)})`;
    }
    
    if (colorState.attributes.hs_color) {
      const [h, s] = colorState.attributes.hs_color;
      const [r, g, b] = this.hslToRgb(h, s, 100);
      return `rgb(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(b * brightness)})`;
    }
    
    if (colorState.attributes.xy_color) {
      const white = Math.round(255 * brightness);
      return `rgb(${white}, ${white}, ${white})`;
    }
    
    if (colorState.attributes.color_temp) {
      const temp = colorState.attributes.color_temp;
      const blue = Math.min(255, Math.max(0, 255 - (temp - 150) / 2));
      const red = Math.min(255, Math.max(0, 150 + (temp - 150) / 4));
      return `rgb(${Math.round(red * brightness)}, ${Math.round(red * brightness)}, ${Math.round(blue * brightness)})`;
    }
    
    // 7. Fallback orange for lights with no color info
    const [r, g, b] = this.hexToRgb('#fec007');
    return `rgb(${Math.round(r * brightness)}, ${Math.round(g * brightness)}, ${Math.round(b * brightness)})`;
  }

  hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    let c = (1 - Math.abs(2 * l - 1)) * s;
    let x = c * (1 - Math.abs((h / 60) % 2 - 1));
    let m = l - c / 2;
    let r, g, b;
    
    if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
    else { r = c; g = 0; b = x; }
    
    return [
      Math.round((r + m) * 255),
      Math.round((g + m) * 255), 
      Math.round((b + m) * 255)
    ];
  }

  hexToRgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16)
    ];
  }

  calculateOutputValue(sliderValue, inputValue) {
    const weight = Math.abs(sliderValue) / this.config.slider_max;
    
    if (sliderValue > 0) {
      return inputValue + (this.config.input_max - inputValue) * weight;
    } else if (sliderValue < 0) {
      return inputValue - (inputValue - this.config.input_min) * weight;
    }
    return inputValue;
  }

  async render() {
    const { 
      output_entity, 
      input_entity,
      color_entity,
      slider_min = -100, 
      slider_max = 100,
      input_min = -100,
      input_max = 100,
      step = 1,
      name = 'Slider',
      unit = '%',
      icon,
      handle_color = '#ffffff',
      handle_shadow_color = '#1c1c1c',
      slider_color = '#4473a0',
      slider_background_color = '#323232'
    } = this.config;
  
    const inputState = this._hass.states[input_entity];
    if (!inputState) {
      this.shadowRoot.innerHTML = `<p>Input entity not found</p>`;
      return;
    }

    // Get the dynamic light color
    const lightColor = this.getLightColor();
    const center_text = icon ? '40px' : '0px';

    this.shadowRoot.innerHTML = `
      <style>
        @import "https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/15.7.0/nouislider.min.css";
        
        .container {
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 4px;
          width: 100%;
          height: 100%;
          box-sizing: border-box;
          position: relative;
        }
        .content-wrapper {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          position: relative;
          min-height: 60px;
        }
        .title {
          font-size: 1rem;
          font-weight: bold;
          margin-bottom: 8px;
          font-family: Arial, sans-serif;
          width: 100%;
          text-align: center; 
          margin-left: ${center_text};
        }
        .slider-row {
          display: flex;
          align-items: center;
          width: 100%;
          position: relative;
          box-shadow: none !important;
          background-color: transparent !important;
        }
        .slider-icon {
          margin-right: 15px;
          color: ${lightColor};
          flex-shrink: 0;
          margin-top: -15px;
        }
        .slider-container {
          flex-grow: 1;
        }
        .slider {
          width: 100%;
          margin: 4px 0;
          border: none;
          box-shadow: none !important;
          background-color: transparent !important;
        }
        .value {
          font-size: 0.85rem;
          font-family: Arial, sans-serif;
          width: 100%;
          text-align: center;
          margin-top: -12px;
          margin-left: ${center_text};
        }
        .noUi-base {
          height: 4px !important;
          border-radius: 4px;
          background: ${slider_background_color} !important;
          border: none !important;
        }
        .noUi-connect {
          height: 4px !important;
          background: ${lightColor} !important;
          border: none !important;
        }
        .noUi-handle {
          width: 14px !important;
          height: 14px !important;
          top: -5px !important;
          right: -5px !important;
          background: ${handle_color} !important;
          border: 2px solid ${lightColor} !important;
          border-radius: 50%;
          box-shadow: 0 0 8px 3px ${handle_shadow_color} !important; 
        }
        .noUi-handle::before,
        .noUi-handle::after {
          display: none !important;
        }
      </style>
      <div class="container">
        <div class="content-wrapper">
          ${name ? `<div class="title">${name}</div>` : ''}
          <div class="slider-row">
            ${icon ? `<ha-icon class="slider-icon" icon="${icon}"></ha-icon>` : ''}
            <div class="slider-container">
              <div class="slider" id="slider"></div>
            </div>
          </div>
          <div class="value" id="current-value">${Math.round(this.currentSliderValue)}${unit}</div>
        </div>
      </div>
    `;

    const slider = this.shadowRoot.getElementById('slider');
    const noUiSlider = await this.loadNoUiSlider();

    noUiSlider.create(slider, {
      start: [this.currentSliderValue],
      connect: [false, false],
      range: { min: slider_min, max: slider_max },
      step: step,
    });

    const connectElement = document.createElement('div');
    connectElement.className = 'noUi-connect';
    slider.querySelector('.noUi-base').appendChild(connectElement);

    const updateConnectElement = (currentValue) => {
      const zeroPos = ((0 - slider_min) / (slider_max - slider_min)) * 100;
      const valuePos = ((currentValue - slider_min) / (slider_max - slider_min)) * 100;
      
      if (currentValue >= 0) {
        connectElement.style.left = `${zeroPos}%`;
        connectElement.style.width = `${valuePos - zeroPos}%`;
      } else {
        connectElement.style.left = `${valuePos}%`;
        connectElement.style.width = `${zeroPos - valuePos}%`;
      }
    };

    updateConnectElement(this.currentSliderValue);

    slider.noUiSlider.on('start', () => this.isUpdating = true);
    
    slider.noUiSlider.on('update', (values) => {
      this.currentSliderValue = parseFloat(values[0]);
      this.shadowRoot.getElementById('current-value').textContent = 
        `${Math.round(this.currentSliderValue)}${unit}`;
      updateConnectElement(this.currentSliderValue);
    });

    slider.noUiSlider.on('change', (values) => {
      this.isUpdating = false;
      this.currentSliderValue = parseFloat(values[0]);
      const inputValue = parseFloat(this._hass.states[input_entity].state);
      const outputValue = this.calculateOutputValue(this.currentSliderValue, inputValue);

      if (this.isLightEntity) {
        if (outputValue <= 0) {
          this._hass.callService('light', 'turn_off', { entity_id: output_entity });
        } else {
          this._hass.callService('light', 'turn_on', {
            entity_id: output_entity,
            brightness_pct: Math.min(100, Math.max(0, outputValue))
          });
        }
      } else {
        this._hass.callService('input_number', 'set_value', {
          entity_id: output_entity,
          value: outputValue
        });
      }
    });
  }

  async loadNoUiSlider() {
    if (!window.noUiSlider) {
      await import("https://cdnjs.cloudflare.com/ajax/libs/noUiSlider/15.7.0/nouislider.min.js");
    }
    return window.noUiSlider;
  }

  getCardSize() {
    return 2;
  }
}

customElements.define('weighted-override-slider-card', WeightedOverrideSliderCard);
