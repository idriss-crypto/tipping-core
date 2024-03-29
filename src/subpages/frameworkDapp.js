import template from "./frameworkDapp.mpts";
import eth_logo from "!!url-loader!../img/eth_logo.png"
import usdc_logo from "!!url-loader!../img/usdc_logo.png"
import arrow from "!!url-loader!../img/arrow.svg"
import pen from "!!url-loader!../img/pen.svg"
import close from "!!url-loader!../img/close.svg"
import maticTokenIcon from "!!url-loader!../img/matic-token-icon.webp"
import biannceCoinLogo from "!!url-loader!../img/binance-coin-logo.webp"
import {tokens} from "../tippingUtils";
import {create} from "fast-creator";


export class FrameworkDapp {
    constructor(data) {
        let networks = [
            {name: 'Polygon ', img: maticTokenIcon, chainId: 137, code: 'Polygon'},
            {name: 'Ethereum', img: eth_logo, chainId: 1, code: 'ETH'},
            {name: 'BSC', img: biannceCoinLogo, chainId: 56, code: 'BSC'},
        ]
        if (data.tokenFilter) {
            networks = networks.filter(n => data.tokenFilter[n.code.toLowerCase()])
        }
        if (data.networkFilter){
            networks = networks.filter(n => data.networkFilter[n.name.toLowerCase()])
        }
        this.html = create('div', {}, template({
            customHeader: data.customHeader,
            customText: data.customText ?? "",
            buttonValue: data.buttonValue,
            networks,
            tokens: this.filterTokens(data.tokenFilter),
            eth_logo,
            usdc_logo,
            arrow,
            pen,
            close
        }));

        this.html.querySelector('.closeButton').onclick = () => this.html.dispatchEvent(Object.assign(new Event('close', {bubbles: true})));

        this.html.querySelectorAll('.select').forEach(select => {
            select.onclick = e => select.classList.toggle('isOpen')
            select.onblur = e => select.classList.remove('isOpen')
            select.onclick = e => select.firstElementChild.focus();
        })
        this.html.querySelectorAll('.select ul li').forEach(li => {
            li.onclick = e => {
                e.stopPropagation();
                const button = li.parentNode.parentNode.querySelector('button')
                button.querySelector('.name').textContent = li.querySelector('.name').textContent;
                button.querySelector('img').src = li.querySelector('img').src;
                Object.assign(button.parentNode.dataset, li.dataset);
                li.parentNode.parentNode.classList.remove('isOpen')
                this.html.querySelector(':focus')?.blur()
                this.refreshVisibleCoins()
            }
        })
        this.html.querySelector('.send')?.addEventListener('click', (e) => {
            let network = this.html.querySelector('.networkSelect').dataset.network;
            let token = this.html.querySelector('.tokenSelect').dataset.symbol;
            let message = this.html.querySelector('.messageBox textarea').value;
            let input = this.html.querySelector('input').value;
            let amount = this.html.querySelector('.valueSelection .isSelected input')?.value || this.html.querySelector('.valueSelection .isSelected').dataset.value;
            this.html.dispatchEvent(Object.assign(new Event('customEvent', {bubbles: true}), {
                input,
                network,
                amount,
                token,
                message
            }))
        });
        this.html.querySelectorAll('.valueSelection > *').forEach(b => {
            b.onclick = e => {
                this.html.querySelectorAll('.valueSelection  > *').forEach(x => x.classList.remove('isSelected'))
                b.classList.add('isSelected')
                b.querySelector('input')?.focus();
            }
        })
        const toggleMessageBox = this.html.querySelector('.toggleMessageBox');
        const messageBox = this.html.querySelector('.messageBox');
        if (!data.showMessageBox)
            toggleMessageBox.style.display = 'none';
        else
            toggleMessageBox.onclick = () => {
                if (messageBox.classList.contains('isHidden')) {
                    messageBox.classList.remove('isHidden')
                    toggleMessageBox.lastChild.textContent = 'No message'
                } else {
                    messageBox.classList.add('isHidden')
                    toggleMessageBox.lastChild.textContent = 'Add a message'
                    messageBox.querySelector('textarea').value = '';
                }
            }
        const toggleValueSelection = this.html.querySelector('.valueSelection');
        if (!data.showValueSelection)
            toggleValueSelection.style.display = 'none';
            this.html.querySelector('.valueSelection .isSelected').dataset.value = ""
        const toggleNetworkSelection = this.html.querySelector('.networkSelection');
        if (!data.showNetworkSelection)
            toggleNetworkSelection.style.display = 'none';
            this.html.querySelector('.networkSelect').dataset.network = "";
        const toggleTokenSelection = this.html.querySelector('.tokenSelection');
        if (!data.showTokenSelection)
            toggleTokenSelection.style.display = 'none';
            this.html.querySelector('.tokenSelect').dataset.symbol = "";
        const toggleInput = this.html.querySelector('.toggleInput');
        if (!data.showInput)
            toggleInput.style.display = 'none';
        const toggleText = this.html.querySelector('.toggleText');
        if (!data.customText)
            toggleText.style.display = 'none';
        this.refreshVisibleCoins();
    }

    refreshVisibleCoins() {
        let network = this.html.querySelector('.networkSelect').dataset.network;
        let tokens = this.html.querySelectorAll('.tokenSelect li')
        for (let token of tokens) {
            token.style.display = token.dataset.network == network ? '' : 'none';
        }
        if (network && this.html.querySelector('.tokenSelect').dataset.network != network) {
            this.html.querySelector(`.tokenSelect li[data-network="${network}"]`).click();
        }
    }

    filterTokens(tokenFilter) {
        if (!tokenFilter) {
            return tokens;
        } else {
            return tokens.filter(t => {
                return tokenFilter[t.network.toLowerCase()]?.includes(t.symbol);
            })
        }
    }

}