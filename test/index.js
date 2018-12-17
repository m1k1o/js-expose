(function() {
   var x = 100;

   var b = function() {
      // I'm private!
      console.log('x old val ' + x)
      x++
      console.log('x new val ' + x)
   }
   
   setTimeout(b, 1000)
   setTimeout(b, 2000)
}())
