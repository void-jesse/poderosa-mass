

from flask import Flask, render_template, request, jsonify
from urllib.parse import quote

from produtos import PRODUTOS, ADICIONAIS, TIPOS_MASSA


app = Flask(__name__)

WHATSAPP_NUMERO = "557996630127"


@app.route("/")
def inicio():

    return render_template(
        "index.html",
        produtos=PRODUTOS,
        adicionais=ADICIONAIS,
        tipos_massa=TIPOS_MASSA
    )


@app.route("/gerar-pedido", methods=["POST"])
def gerar_pedido():

    dados = request.get_json(silent=True) or {}

    nome = dados.get("nome", "").strip()
    endereco = dados.get("endereco", "").strip()
    referencia = dados.get("referencia", "").strip()
    observacoes = dados.get("observacoes", "").strip()

    itens = dados.get("itens", [])

    if not nome or not endereco:
        return jsonify({
            "erro": "Informe seu nome e endereço."
        }), 400

    if not itens:
        return jsonify({
            "erro": "Seu carrinho está vazio."
        }), 400

    produtos_por_id = {
        produto["id"]: produto
        for produto in PRODUTOS
    }

    adicionais_por_id = {
        adicional["id"]: adicional
        for adicional in ADICIONAIS
    }

    total = 0
    linhas_pedido = []

    for item in itens:

        try:
            produto_id = int(item["produto_id"])
            quantidade = int(item["quantidade"])
        except (ValueError, TypeError, KeyError):
            return jsonify({
                "erro": "Item inválido."
            }), 400

        produto = produtos_por_id.get(produto_id)

        if not produto:
            return jsonify({
                "erro": "Produto não encontrado."
            }), 400

        tamanho = item.get("tamanho")
        tipo_massa = item.get("tipo_massa")
        molho = item.get("molho", "")

        if tamanho not in produto["precos"]:
            return jsonify({
                "erro": "Tamanho inválido."
            }), 400

        if tipo_massa not in TIPOS_MASSA:
            return jsonify({
                "erro": "Tipo de massa inválido."
            }), 400

        if quantidade < 1 or quantidade > 20:
            return jsonify({
                "erro": "Quantidade inválida."
            }), 400

        if molho not in produto["molhos"]:
            return jsonify({
                "erro": "Molho inválido para este produto."
            }), 400

        preco_base = produto["precos"][tamanho]

        preco_extras = 0
        nomes_extras = []

        adicionais_ids = item.get("adicionais", [])

        if not isinstance(adicionais_ids, list):
            return jsonify({
                "erro": "Adicionais inválidos."
            }), 400

        for adicional_id in adicionais_ids:

            try:
                adicional_id = int(adicional_id)
            except (ValueError, TypeError):
                return jsonify({
                    "erro": "Adicional inválido."
                }), 400

            adicional = adicionais_por_id.get(adicional_id)

            if not adicional:
                return jsonify({
                    "erro": "Adicional não encontrado."
                }), 400

            preco_extras += adicional["preco"]
            nomes_extras.append(adicional["nome"])

        subtotal = (preco_base + preco_extras) * quantidade

        total += subtotal

        linha = (
            f"- {quantidade}x {produto['nome']} "
            f"({tamanho.capitalize()})\n"
            f"  Massa: {tipo_massa}\n"
            f"  Molho: {molho}"
        )

        if nomes_extras:
            linha += (
                "\n  Extras: "
                + ", ".join(nomes_extras)
            )

        linha += (
            f"\n  Subtotal: R$ {subtotal:.2f}"
        )

        linhas_pedido.append(linha)

    mensagem = (
        "Olá! Gostaria de fazer um pedido "
        "na Poderosa Massa.\n\n"
        f"Nome: {nome}\n"
        f"Endereço: {endereco}\n"
    )

    if referencia:
        mensagem += f"Referência: {referencia}\n"

    mensagem += (
        "\nPEDIDO:\n"
        + "\n\n".join(linhas_pedido)
    )

    mensagem += (
        f"\n\nTOTAL DOS PRODUTOS: R$ {total:.2f}"
        "\nTaxa de entrega: a confirmar."
        "\nPagamento: a combinar."
    )

    if observacoes:
        mensagem += f"\n\nObservações: {observacoes}"

    link_whatsapp = (
        f"https://wa.me/{WHATSAPP_NUMERO}"
        f"?text={quote(mensagem, safe='', encoding='utf-8')}"
    )

    return jsonify({
        "whatsapp_url": link_whatsapp
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)