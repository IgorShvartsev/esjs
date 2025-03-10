
# JavaScript Element Collection Utility

This utility provides a set of methods to manipulate DOM elements in a more convenient way. It includes methods for adding/removing attributes, classes, styles, and handling events.

## Usage
```
import {default  as  el} from  './el.js';
   
// create
const  newDiv = el.create('div')
    .addAttr({'role':  'test', 'dest':  'target'})
    .addClass('green')
    .html('<h2>NEWS</h2>')
    .css({background:  '#999', color:  '#fff', display:  'flex', 'justify-content':  'center'});

el.q('body').append(newDiv);
    
      
// modify
const  li = el.q('.news')
    .find('ul').css({'list-style':  'none', 'padding-left':  0})
    .find('li').css({padding:  '8px 10px 8px'})
    .siblings('.second').css('background', '#fdff77').css('color', '#118ca7');
```

### Importing the Utility

```
import {default  as  el} from  './el.js';
```
