# JavaScript Expose
Accessing private JavaScript variables and adding hooks using regular expressions. This script should run at document-start, ideally in some Browser extension or Tampermonkey.

# Usage
one external javascript file or inline script.

```js
exposeJs({
    scriptUri: /fileName\.js/, // For <script src=""></script>
    scriptText: /matching string/, // For <script></script>
    replace: [
        [
            "var:name var:another hook:myHook hook:anotherHook ...", // What
            /var x = .../, // From (RegEx)
            "$v=$1;$v1=$2;$H();$&" // To
        ],
        // ...
    ]
}, (exposed) => {
    console.log("Exposed data:", exposed)
}, 'exposeObjectName') // If name is not present, default 'exposeJs' is used
```

## To: syntax
There are some shortcuts available, starting with $.

```
$v=$1;$v1=$2;$H();$&
```

- `$v` => `window.exposeJs.name`
- `$v1` => `window.exposeJs.another`
- `$H()` => `window.exposeJs.hooks.myHook&&window.exposeJs.hooks.myHook()`
- `$h2()` => `window.exposeJs.hooks.anotherHook()`
- `$&` means whole match (regex thing).

# WARNING: Experimental
Please don't use this in production, this is just experimental solution.

# TODO: Refactor
