import css from "./tippingStyle.scss";
import {create} from "fast-creator";
import {TippingMain} from "./subpages/tippingMain";
import {FrameworkDapp} from "./subpages/frameworkDapp";
import {TippingAddress} from "./subpages/tippingAddress";
import {TippingWaitingApproval} from "./subpages/tippingWaitingApproval"
import {TippingWaitingConfirmation} from "./subpages/tippingWaitingConfirmation"
import {TippingError} from "./subpages/tippingError";
import {TippingSuccess} from "./subpages/tippingSuccess";
import {getProvider} from "./getWeb3Provider";
import {TippingLogic} from "./tippingLogic"

export class IdrissTippingWidget extends HTMLElement {
    constructor(config) {
        super();
        Object.assign(this, config);
        this.attachShadow({mode: 'open'})
        this.shadowRoot.append(create('style', {text: css}));
        this.container = create('section.tipping-popup')
        this.shadowRoot.append(this.container);

        this.shadowRoot.addEventListener('close', () => this.close());
        this.tipProcess();
    }
close(){
        console.log('close');
    this.dispatchEvent(Object.assign(new Event('close', {bubbles :true})))
}
    async tipProcess() {
        if (!this.identifier) {
            this.container.append(new TippingAddress().html);
            await new Promise(res => {
                this.container.addEventListener('next', e => {
                    console.log(e);
                    this.identifier = e.identifier;
                    this.recipient = e.recipient;
                    res()
                })
            });
        }
        if (!this.token || !this.tippingValue || !this.network) {
            this.clearContainer();
            this.container.append(new TippingMain(this.identifier).html);
            await new Promise(res => {
                this.container.addEventListener('sendMoney', e => {
                    console.log(e);
                    this.network = e.network;
                    this.token = e.token;
                    this.tippingValue = +e.amount;
                    this.message = e.message;
                    res()
                })
            });
        }
        let provider
        try {
            provider = await getProvider();
        } catch (ex) {
            console.error(ex);
        }
        if (!provider) {
            let urlParams = {
                identifier: this.identifier,
                recipient: this.recipient,
                token: this.token,
                tippingValue: this.tippingValue,
                network: this.network
            }
            window.open(`https://www.idriss.xyz/tip?` + Object.entries(urlParams).map(([k, v]) => k + '=' + encodeURIComponent(v)).join('&'));
            return;
        }
        this.clearContainer()
        this.container.append(new TippingWaitingApproval(this.token).html);

        await TippingLogic.prepareTip(provider, this.network)
        this.clearContainer()
        this.container.append((new TippingWaitingConfirmation(this.identifier, this.tippingValue, this.token)).html)
        let {
            integer: amountInteger,
            normal: amountNormal
        } = await TippingLogic.calculateAmount(this.token, this.tippingValue)

        this.container.querySelector('.amountCoin').textContent = amountNormal;
        let success = await TippingLogic.sendTip(this.recipient, this.amountInteger, this.network, this.token, this.message ?? "")

        this.clearContainer()
        if (success) {
            let explorerLink;
            if (this.network == 'ETH')
                explorerLink = `https://etherscan.io/tx/${success.transactionHash}`
            else if (this.network == 'BSC')
                explorerLink = `https://bscscan.com/tx/${success.transactionHash}`
            else if (this.network == 'Polygon')
                explorerLink = `https://polygonscan.com/tx/${success.transactionHash}`
            this.container.append((new TippingSuccess(this.identifier, explorerLink)).html)
        } else {
            this.container.append((new TippingError()).html)
            console.log({success})
        }
    }

    clearContainer() {
        while (this.container.firstChild) {
            this.container.firstChild.remove();
        }
    }
}

customElements.define('idriss-payment-widget', IdrissTippingWidget);