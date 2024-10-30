import { observeAttributeBySelector, observeBySelector, observeContentBox } from "./Observer";

// @ts-ignore
import styles from "./FlexLike.scss?inline";
const preInit = URL.createObjectURL(new Blob([styles], {type: "text/css"}));

// this flex-like supports animations
export default class FlexLike extends HTMLDivElement {
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
customElements.define('u-rows', FlexLike, {extends: 'div'});

// Pre-load rows stylesheets
{   //
    const style = document.createElement("link");
    style.rel = "stylesheet";
    style.type = "text/css";
    style.href = preInit;
    style.dataset.owner = "rows";
    document.head.appendChild(style);
}
