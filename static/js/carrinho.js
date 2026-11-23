
const catalogo = JSON.parse(
    document.getElementById("catalogo").textContent
);

const carrinho = [];

let produtoSelecionado = null;

const modal = document.getElementById("modal-personalizacao");


// FORMATAÇÃO DE PREÇOS

function dinheiro(valor) {
    return valor.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}


// ENCONTRAR PRODUTO

function encontrarProduto(id) {
    return catalogo.produtos.find(
        produto => produto.id === Number(id)
    );
}


// ABRIR MODAL

function abrirModal(id) {

    produtoSelecionado = encontrarProduto(id);

    if (!produtoSelecionado) {
        return;
    }

    document.getElementById("modal-nome-produto").textContent =
        produtoSelecionado.nome;

    document.getElementById("modal-descricao").textContent =
        produtoSelecionado.descricao;

    document.getElementById("preco-pequeno").textContent =
        dinheiro(produtoSelecionado.precos.pequeno);

    document.getElementById("preco-medio").textContent =
        dinheiro(produtoSelecionado.precos.medio);


    // TAMANHO PADRÃO

    document.querySelector(
        'input[name="tamanho"][value="pequeno"]'
    ).checked = true;


    // MASSA PADRÃO DO PRODUTO

    document.getElementById("tipo-massa").value =
        produtoSelecionado.massa_padrao;


    // QUANTIDADE

    document.getElementById("quantidade").value = 1;


    // MOLHOS DO PRODUTO

    const areaMolhos = document.getElementById("area-molhos");

    areaMolhos.innerHTML = `
        <label class="campo-modal">
            Escolha o molho

            <select id="molho" required>
                ${produtoSelecionado.molhos.map(molho => `
                    <option value="${molho}">
                        ${molho}
                    </option>
                `).join("")}
            </select>
        </label>
    `;


    // ADICIONAIS

    const lista = document.getElementById("lista-adicionais");

    lista.innerHTML = catalogo.adicionais.map(adicional => `
        <label class="opcao-extra">

            <input
                type="checkbox"
                value="${adicional.id}"
                class="checkbox-adicional"
            >

            <span>${adicional.nome}</span>

            <strong>
                + ${dinheiro(adicional.preco)}
            </strong>

        </label>
    `).join("");


    atualizarSubtotalModal();

    modal.showModal();
}


// CALCULAR SUBTOTAL

function atualizarSubtotalModal() {

    if (!produtoSelecionado) {
        return;
    }

    const tamanho = document.querySelector(
        'input[name="tamanho"]:checked'
    ).value;

    const precoBase = produtoSelecionado.precos[tamanho];

    const adicionaisMarcados = document.querySelectorAll(
        ".checkbox-adicional:checked"
    );

    let precoExtras = 0;

    adicionaisMarcados.forEach(checkbox => {

        const adicional = catalogo.adicionais.find(
            item => item.id === Number(checkbox.value)
        );

        if (adicional) {
            precoExtras += adicional.preco;
        }

    });

    const quantidade = Number(
        document.getElementById("quantidade").value
    );

    const subtotal = (precoBase + precoExtras) * quantidade;

    document.getElementById("subtotal-modal").textContent =
        dinheiro(subtotal);
}


// EVENTOS DO MODAL

document.querySelectorAll(
    'input[name="tamanho"]'
).forEach(campo => {

    campo.addEventListener("change", atualizarSubtotalModal);

});

document.getElementById("quantidade").addEventListener(
    "input",
    atualizarSubtotalModal
);

document.getElementById("lista-adicionais").addEventListener(
    "change",
    atualizarSubtotalModal
);


// FECHAR MODAL

document.getElementById("fechar-modal").addEventListener(
    "click",
    () => modal.close()
);


// ADICIONAR AO CARRINHO

function adicionarAoCarrinho(evento) {

    evento.preventDefault();

    if (!produtoSelecionado) {
        return;
    }

    const tamanho = document.querySelector(
        'input[name="tamanho"]:checked'
    ).value;

    const tipoMassa = document.getElementById("tipo-massa").value;

    const molho = document.getElementById("molho").value;

    const quantidade = Number(
        document.getElementById("quantidade").value
    );

    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 20) {
        alert("Escolha uma quantidade entre 1 e 20.");
        return;
    }

    const adicionaisMarcados = document.querySelectorAll(
        ".checkbox-adicional:checked"
    );

    const idsAdicionais = Array.from(adicionaisMarcados).map(
        checkbox => Number(checkbox.value)
    );

    const adicionaisSelecionados = catalogo.adicionais.filter(
        adicional => idsAdicionais.includes(adicional.id)
    );

    const precoBase = produtoSelecionado.precos[tamanho];

    const precoExtras = adicionaisSelecionados.reduce(
        (soma, adicional) => soma + adicional.preco,
        0
    );

    const subtotal = (precoBase + precoExtras) * quantidade;

    const item = {

        // IDENTIFICADOR COMPATÍVEL COM CELULARES
        chave: Date.now() + "-" + Math.random().toString(16).slice(2),

        produtoId: produtoSelecionado.id,

        nome: produtoSelecionado.nome,

        tamanho: tamanho,

        tipoMassa: tipoMassa,

        molho: molho,

        adicionais: idsAdicionais,

        adicionaisNomes: adicionaisSelecionados.map(
            adicional => adicional.nome
        ),

        quantidade: quantidade,

        subtotal: subtotal

    };

    carrinho.push(item);

    renderizarCarrinho();

    modal.close();

    produtoSelecionado = null;
}


document.getElementById("form-personalizacao").addEventListener(
    "submit",
    adicionarAoCarrinho
);


// BOTÕES DOS PRODUTOS

document.querySelectorAll("[data-produto-id]").forEach(botao => {

    botao.addEventListener("click", () => {
        abrirModal(botao.dataset.produtoId);
    });

});


// REMOVER ITEM

function removerItem(chave) {

    const indice = carrinho.findIndex(
        item => item.chave === chave
    );

    if (indice !== -1) {
        carrinho.splice(indice, 1);
        renderizarCarrinho();
    }
}


// ATUALIZAR CARRINHO

function renderizarCarrinho() {

    const area = document.getElementById("itens-carrinho");

    const total = carrinho.reduce(
        (soma, item) => soma + item.subtotal,
        0
    );

    const quantidade = carrinho.reduce(
        (soma, item) => soma + item.quantidade,
        0
    );

    document.getElementById("contador-carrinho").textContent =
        quantidade;

    document.getElementById("valor-total").textContent =
        dinheiro(total);

    if (carrinho.length === 0) {

        area.innerHTML = `
            <p class="carrinho-vazio">
                Seu carrinho ainda está vazio.
            </p>
        `;

        return;
    }

    area.innerHTML = carrinho.map(item => `
        <article class="item-carrinho">

            <div>
                <strong>
                    ${item.quantidade}x ${item.nome}
                    (${item.tamanho})
                </strong>

                <small>${item.tipoMassa}</small>

                <small>Molho: ${item.molho}</small>

                ${item.adicionaisNomes.length > 0 ? `
                    <small>
                        Extras: ${item.adicionaisNomes.join(", ")}
                    </small>
                ` : ""}
            </div>

            <div class="preco-item">
                <strong>${dinheiro(item.subtotal)}</strong>

                <button
                    type="button"
                    class="link-remover"
                    data-remover="${item.chave}"
                >
                    Remover
                </button>
            </div>

        </article>
    `).join("");

    area.querySelectorAll("[data-remover]").forEach(botao => {

        botao.addEventListener("click", () => {
            removerItem(botao.dataset.remover);
        });

    });
}


// FINALIZAR PEDIDO

async function finalizarPedido(evento) {

    evento.preventDefault();

    const mensagemErro = document.getElementById("mensagem-erro");

    mensagemErro.textContent = "";

    if (carrinho.length === 0) {
        mensagemErro.textContent =
            "Adicione pelo menos um produto ao carrinho.";
        return;
    }

    const dados = {
        nome: document.getElementById("nome").value,
        endereco: document.getElementById("endereco").value,
        referencia: document.getElementById("referencia").value,
        observacoes: document.getElementById("observacoes").value,

        itens: carrinho.map(item => ({
            produto_id: item.produtoId,
            tamanho: item.tamanho,
            tipo_massa: item.tipoMassa,
            molho: item.molho,
            adicionais: item.adicionais,
            quantidade: item.quantidade
        }))
    };

    try {

        const resposta = await fetch("/gerar-pedido", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        console.log("Resposta do servidor:", resultado);

        if (!resposta.ok) {
            mensagemErro.textContent =
                resultado.erro || "Não foi possível gerar o pedido.";
            return;
        }

        if (!resultado.whatsapp_url) {
            mensagemErro.textContent =
                "O servidor não retornou o link do WhatsApp.";
            return;
        }

        window.location.href = resultado.whatsapp_url;

    } catch (erro) {

        console.error("Erro ao enviar pedido:", erro);

        mensagemErro.textContent =
            "Erro ao processar o pedido: " + erro.message;
    }
}


document.getElementById("form-finalizacao").addEventListener(
    "submit",
    finalizarPedido
);


// ESTADO INICIAL

renderizarCarrinho();

