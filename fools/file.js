'use strict';

goog.provide('Blockly.FieldCustom');

const customInputs = new Map();

Blockly.FieldCustom = function(options) {
  Blockly.FieldCustom.superClass_.constructor.call(this, options);
  this.addArgType('text');

  this.inputID = options.id ? options.id : null;

  this.value_ = options.value ? options.value : '';
  this.inputParts = {};

  this.mouseDownWrapper_ = null;
};
goog.inherits(Blockly.FieldCustom, Blockly.Field);

Blockly.FieldCustom.fromJson = function(options) {
  return new Blockly.FieldCustom(options);
};

Blockly.FieldCustom.registerInput = function(id, templateHTML, onInit, onClick, onUpdate, optOnDispose) {
  if (!id || typeof id !== 'string') {
    console.warn('Param 1 must be a non-empty string id!');
    return;
  }
  if (customInputs.has && customInputs.has(id)) {
    console.warn('An input with id "' + id + '" is already registered; overriding.');
  }
  if (!templateHTML || !(templateHTML instanceof Node)) {
    console.warn('Param 2 must be a valid DOM element!');
    return;
  }
  if (!onInit || typeof onInit !== 'function') {
    console.warn('Param 3 must be a function!');
    return;
  }
  if (!onClick || typeof onClick !== 'function') {
    console.warn('Param 4 must be a function!');
    return;
  }
  if (!onUpdate || typeof onUpdate !== 'function') {
    console.warn('Param 5 must be a function!');
    return;
  }
  if (optOnDispose && typeof optOnDispose !== 'function') {
    console.warn('Param 6 must be a function!');
    return;
  }
  customInputs.set(id, { templateHTML, onInit, onClick, onUpdate, optOnDispose });
};
Blockly.FieldCustom.unregisterInput = function(id) {
  customInputs.delete(id);
};
Blockly.FieldCustom.registeredInputs = function() {
  return customInputs;
};

Blockly.FieldCustom.prototype.init = function() {
  if (this.fieldGroup_) {
    // custom field has already been initialized
    return;
  }

  this.inputParts = customInputs.get(this.inputID);
  if (!this.inputParts) {
    console.error(`No Custom Input found with ID '${this.inputID}', did you use 'registerInput'?`);
    return;
  }

  // Build the DOM.
  const htmlDOM = this.inputParts.templateHTML.cloneNode(true);
  htmlDOM.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
  this.inputParts.html = htmlDOM; // makes it easier for ext devs to find the input theyre editting
  
  this.fieldGroup_ = Blockly.utils.createSvgElement('g', {}, null);
  const boundingBox = htmlDOM.getBoundingClientRect();
  this.size_.width = htmlDOM.width ? htmlDOM.width : htmlDOM.style.width ? parseFloat(htmlDOM.style.width) :
    boundingBox.width;
  this.size_.height = htmlDOM.height ? htmlDOM.height : htmlDOM.style.height ? parseFloat(htmlDOM.style.height) :
    Math.max(32, boundingBox.height);

  this.sourceBlock_.getSvgRoot().appendChild(this.fieldGroup_);

  this.inputSource = Blockly.utils.createSvgElement('foreignObject', {
    'width': this.size_.width, 'height': this.size_.height,
    'pointer-events': 'all', 'cursor': 'pointer', 'overflow': 'visible'
  }, this.fieldGroup_);
  this.inputSource.appendChild(htmlDOM);

  this.mouseDownWrapper_ = Blockly.bindEventWithChecks_(
      this.getClickTarget_(), 'mousedown', this, this.onMouseDown_
  );
  queueMicrotask(() => {
    this.inputParts.onInit(this, this.inputParts.html);
  });
};

Blockly.FieldCustom.prototype.setValue = function(value) {
  if (!value || value === this.value_) {
    return; // No change
  }
  if (this.sourceBlock_ && Blockly.Events.isEnabled()) {
    Blockly.Events.fire(new Blockly.Events.Change(
      this.sourceBlock_, 'field', this.name, this.value_, value
    ));
  }
  this.value_ = value;
  if (this.inputParts !== undefined && this.inputParts.onUpdate) {
    const htmlDOM = this.inputParts.html;
    this.inputParts.onUpdate(this, htmlDOM);
  }
};

Blockly.FieldCustom.prototype.getValue = function() {
  return this.value_;
};

Blockly.FieldCustom.prototype.showEditor_ = function() {
  const htmlDOM = this.inputParts.html;
  this.inputParts.onClick(this, htmlDOM);
};

Blockly.FieldCustom.prototype.dispose_ = function() {
  var thisField = this;
  return function() {
    if (thisField.inputParts.optOnDispose) {
      const htmlDOM = this.inputParts.html;
      thisField.inputParts.optOnDispose(thisField, htmlDOM);
    }
    Blockly.FieldCustom.superClass_.dispose_.call(thisField)();
    if (thisField.mouseDownWrapper_) Blockly.unbindEvent_(thisField.mouseDownWrapper_);
  };
};

Blockly.Field.register('field_customInput', Blockly.FieldCustom);


/**
 * isToCalculate Age
 */
function isAge(){
  console.log("asdsd");
}