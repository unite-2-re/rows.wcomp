import { observeAttributeBySelector, observeBySelector, observeContentBox } from "./Observer";

// @ts-ignore
import styles from "./FlexLike.scss?inline&compress";
const preInit = URL.createObjectURL(new Blob([styles], {type: "text/css"}));

// this flex-like supports animations
export default class UIFlexLike extends HTMLDivElement {
    static observedAttributes = ["data-direction"];

    //
    connectedCallback() {
        delete this.dataset.enableTransition;
        this.#recalculate();
    }

    //
    constructor() {
        super();

        //
        const style = document.createElement("style");
        style.innerHTML = `@import url("${preInit}");`;
        this?.shadowRoot?.appendChild?.(style);

        //
        this.style.position = "relative";

        //
        observeAttributeBySelector(document.documentElement, "*[data-hidden]", "data-hidden", (m)=>{
            const has = Array.from(m.target.querySelectorAll("*[is=\"u-rows\"]"));
            if (has.length > 0 && has.some((e)=>(e==this)) && (m.oldValue != m.target.dataset.hidden)) {
                delete this.dataset.enableTransition;
            }
        });

        // when some-one change 'data-hidden' state
        this.addEventListener("u2-hidden", ()=>{ this.#recalculate(); });
        this.addEventListener("u2-appear", ()=>{ this.#recalculate(); });

        //
        observeBySelector(this, "*", (_)=>{
            this.#recalculate();
        });

        //
        observeContentBox(this, (_)=>{
            this.#recalculate();
        });
    }

    // flex-direction: column
    // TODO: support for wrap
    #recalculate() {
        //await new Promise((r)=>requestAnimationFrame(r));

        //
        const ordered: any[] = [];
        const gap = (this.dataset.gap ? parseFloat(this.dataset.gap) : 0) || 0;

        // @ts-ignore
        for (const child of this.children) { ordered.push(child); }

        //
        let height = 0;
        let width  = 0;
        ordered.sort((a,b)=>{
            return Math.sign((parseInt(a.dataset.order)||0)-(parseInt(b.dataset.order)||0));
        }).forEach((child, I, A)=>{
            child.style.setProperty("--inset-block-start", height + "px");
            height += child.offsetHeight;
            if (I < (A.length-1)) height += gap;
            width = Math.max(width, child.offsetWidth);
        });

        //
        this.style.setProperty("--block-size", height + "px");
        this.dataset.enableTransition = "true";
    }
}

//
customElements.define('ui-rows', UIFlexLike, {extends: 'div'});

//
const OWNER = "rows";;

//
const setStyleURL = (base: [any, any], url: string)=>{
    //
    if (base[1] == "innerHTML") {
        base[0][base[1]] = `@import url("${url}");`;
    } else {
        base[0][base[1]] = url;
    }
}

//
const hash = async (string) => {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    return "sha256-" + btoa(String.fromCharCode.apply(null, new Uint8Array(hashBuffer) as unknown as number[]));
}

//
const loadStyleSheet = async (inline: string, base?: [any, any])=>{
    const url = URL.canParse(inline) ? inline : URL.createObjectURL(new Blob([inline], {type: "text/css"}));
    if (base?.[0] && !URL.canParse(inline) && base?.[0] instanceof HTMLLinkElement) {
        base[0].setAttribute("integrity", await hash(inline));
    }
    if (base) setStyleURL(base, url);
}

//
const loadBlobStyle = (inline: string)=>{
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.crossOrigin = "same-origin";
    style.dataset.owner = OWNER;
    loadStyleSheet(inline, [style, "href"]);
    document.head.appendChild(style);
    return style;
}

//
const loadInlineStyle = (inline: string, rootElement = document.head)=>{
    const PLACE = (rootElement.querySelector("head") ?? rootElement);
    if (PLACE instanceof HTMLHeadElement) { loadBlobStyle(inline); }

    //
    const style = document.createElement("style");
    style.dataset.owner = OWNER;
    loadStyleSheet(inline, [style, "innerHTML"]);
    PLACE.appendChild(style);
}

//
loadBlobStyle(preInit);
