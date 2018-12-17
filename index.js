function exposeJs(rule, cb, exposeName = 'exposeJs') {
    if (document.readyState !== "loading") {
        console.error(exposeName+": this script should run at document-start")
    }

    let findScript = (condition, callback) => {
        // Iterate over document.head child elements and look for script
        for (var i = 0; i < document.head.childNodes.length; i++) {
            let node = document.head.childNodes[i]

            if (condition(node)) {
                callback(node)
                return
            }
        }

        // If there are no desired element in document.head, then wait until it appears
        let observer = new MutationObserver((mutations) => {
            for (let i = 0; i < mutations.length; i++) {
                let nodes = mutations[i].addedNodes

                for (let j = 0; j < nodes.length; j++) {
                    let node = nodes[j]
                    
                    if (condition(node)) {
                        console.log(exposeName+": observer disconnected");
                        observer.disconnect()

                        callback(node)
                        return
                    }
                }
            }
        })

        console.log(exposeName+": observer started");
        let html = document.childNodes[1]
        observer.observe(html, {
            childList: true,
            subtree: true
        })
    }

    let replaceNode = (node, replace, cb) => {
        node.textContent = replace(node.textContent)
        console.log(exposeName+": replacement done");
        setTimeout(cb, 0)
    }

    // Firefox simplified version
    if(/Firefox/.test(navigator.userAgent)) {
        // The beforescriptexecute event
        findScript = (condition, callback) => {
            let listener = (e) => {
                if (condition(e.target)) {
                    e.preventDefault();
                    window.removeEventListener("beforescriptexecute", listener, true)

                    callback(e.target)
                }
            }

            window.addEventListener("beforescriptexecute", listener, true)
        }

        replaceNode = (node, replace, cb) => {
            let parentNode = node.parentNode

            let script = document.createElement("script")
            script.textContent = replace(node.textContent)

            parentNode.removeChild(node)
            parentNode.appendChild(script)
            console.log(exposeName+": replacement done");
            setTimeout(cb, 0)
        }
    }

    let xhrNode = (node, replace, cb) => {
        let parentNode = node.parentNode

        let xhr = new XMLHttpRequest()
        xhr.onload = () => {
            let script = document.createElement("script");
            script.textContent = replace(xhr.responseText)
            
            parentNode.appendChild(script);
            parentNode.removeChild(node);
            console.log(exposeName+": replacement done");
            cb()
        }

        xhr.onerror = () => {
            console.error(exposeName+": response was null")
        }

        xhr.open("get", node.src, true)
        xhr.send()
    }

    let replace = (text, what, from, to) => {
        let vars = [], hooks = []

        what.split(" ").forEach(arg => {
            let [type, val] = arg.split(":")

            type === "var" && vars.push(val);
            type === "hook" && hooks.push(val)
        })

        let shortcuts = (str) => {
            let evaluate = (letter, array, func) => {
                str = str.split(new RegExp("\\$" + letter + "([0-9]?)")).map((v, n) => {
                    return n % 2 ? func(array[v || 0]) : v
                }).join("")
            }

            evaluate("v", vars,
                name => `window.${exposeName}.${name}`);
            evaluate("h", hooks,
                name => `window.${exposeName}.hooks.${name}`);
            evaluate("H", hooks,
                name => `window.${exposeName}.hooks.${name}&&window.${exposeName}.hooks.${name}`);
            
            return str
        }

        return text.replace(from, shortcuts(to));
    }

    let evaluateRules = (rule, cb) => {
        let condition = (node) => {
            let linked = rule.scriptUri && rule.scriptUri.test(node.src);
            let embedded = rule.scriptText && rule.scriptText.test(node.textContent);

            return node.tagName == "SCRIPT" && (linked || embedded)
        }

        let evaluate = (str) => {
            let result = true

            rule.replace.forEach(([what, from, to]) => {
                let newStr = replace(str, what, from, to)

                if(newStr == str) {
                    console.error(exposeName+": `" + what + "` replacement failed!")
                    result = false
                }
                
                str = newStr
            });
            
            if(result){
                console.log(exposeName+": evaluated successfully.")
            }

            return `window.${exposeName}={hooks:{}};${str}`
        }

        findScript(condition, (node) => {
            if(node.textContent) {
                replaceNode(node, evaluate, cb)
            } else {
                xhrNode(node, evaluate, cb)
            }
        })
    }

    evaluateRules(rule, () => cb(window[exposeName]));
}
