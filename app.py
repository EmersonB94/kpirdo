from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import json

app = Flask(__name__)
CORS(app)

# ------------------------------------------
# 🔧 CONFIG DO BANCO
# ------------------------------------------
def conectar():
    try:
        return mysql.connector.connect(
            host="sql10.freesqldatabase.com",
            database="sql10805265",
            user="sql10805265",
            password="SXqt5m8ZIq",
            port=3306
        )
    except Error as e:
        print("Erro ao conectar ao MySQL:", e)
        return None

# ------------------------------------------
# PÁGINAS HTML
# ------------------------------------------
@app.route("/")
def home():
    return send_from_directory('.', "index.html")

@app.route("/page_inicio")
def page_inicio():
    return send_from_directory('.', "inicio.html")

@app.route("/page_obras")
def page_obras():
    return send_from_directory('.', "obras.html")

@app.route("/page_rdo")
def page_rdo():
    return send_from_directory('.', "rdo.html")

@app.route("/page_usuario")
def page_usuario():
    return send_from_directory('.', "usuario.html")

@app.route("/teste")
def teste():
    return jsonify({"ok": True})

# ------------------------------------------
# 🔐 LOGIN
# ------------------------------------------
@app.route("/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    senha = data.get("senha")

    con = conectar()
    cursor = con.cursor(dictionary=True)

    # ✅ Busca o usuário primeiro
    cursor.execute("""
        SELECT id, nome, email, cargo, perfilacesso, modusuario, status 
        FROM rdo_cad_usuario 
        WHERE email=%s AND senha=%s
    """, (email, senha))

    usuario = cursor.fetchone()

    if usuario:
        # ✅ Atualiza o último acesso
        cursor.execute("""
            UPDATE rdo_cad_usuario 
            SET dtacesso = now()
            WHERE id = %s
        """, (usuario["id"],))

        con.commit()

        cursor.close()
        con.close()

        return jsonify({"status": "ok", "usuario": usuario})

    else:
        cursor.close()
        con.close()
        return jsonify({
            "status": "erro",
            "mensagem": "Usuário ou senha incorretos"
        }), 401

# ------------------------------------------
# 👤 USUÁRIOS
# ------------------------------------------
@app.route("/usuario", methods=["POST"])
def criar_usuario():
    data = request.json
    con = conectar()
    cursor = con.cursor()

    query = """
        INSERT INTO rdo_cad_usuario 
        (nome, contato, cargo, email, senha, assinatura, perfilacesso, permissaoobra, status, mdusuario, dtcadastro)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
    """

    valores = (
        data["nome"], data["contato"], data["cargo"], data["email"], data["senha"],
        data.get("assinatura", ""), data.get("perfilacesso", ""), 
        data.get("permissaoobra", ""), data["status"],data["modusuario"]
    )

    cursor.execute(query, valores)
    con.commit()
    novo_id = cursor.lastrowid

    cursor.close()
    con.close()

    return jsonify({"status": "ok", "id": novo_id})

@app.route("/usuario/<int:id>", methods=["PUT"])
def atualizar_usuario(id):
    data = request.json
    con = conectar()
    cursor = con.cursor()

    query = """
        UPDATE rdo_cad_usuario SET 
        nome=%s, contato=%s, cargo=%s, email=%s, senha=%s,
        assinatura=%s, perfilacesso=%s, permissaoobra=%s, status=%s, modusuario=%s,
        dtatualizacao=NOW()
        WHERE id=%s
    """

    valores = (
        data["nome"], data["contato"], data["cargo"], data["email"], data["senha"],
        data.get("assinatura", ""), data.get("perfilacesso", ""), 
        data.get("permissaoobra", ""), data["status"], data["modusuario"], id
    )

    cursor.execute(query, valores)
    con.commit()
    cursor.close()
    con.close()

    return jsonify({"status": "ok"})

@app.route("/usuario/<int:id>", methods=["GET"])
def obter_usuario(id):
    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nome, email, cargo, senha, contato, perfilacesso, status, permissaoobra, modusuario
            FROM rdo_cad_usuario
            WHERE id = %s
        """, (id,))
        usuario = cursor.fetchone()
        if not usuario:
            return jsonify({"erro": "Usuário não encontrado"}), 404
        return jsonify(usuario)
    except Error as e:
        print("Erro ao buscar usuário:", e)
        return jsonify({"erro": "Erro interno"}), 500
    finally:
        if conn.is_connected():
            conn.close()

@app.route("/API/usuario", methods=["GET"])
def listar_usuarios():
    con = conectar()
    cursor = con.cursor(dictionary=True)
    cursor.execute("SELECT * FROM rdo_cad_usuario ORDER BY nome DESC")
    resultado = cursor.fetchall()
    cursor.close()
    con.close()
    return jsonify(resultado)

# ------------------------------------------
# 🧱 OBRAS (API)
# ------------------------------------------
@app.route("/API/obra", methods=["POST"])
def criar_obra():
    data = request.json
    con = conectar()
    cursor = con.cursor()
    query = """
        INSERT INTO rdo_cad_obra
        (nome, empresa, contraton, contratoprazo, contratoresponsavel, status, dtcadastro)
        VALUES (%s, %s, %s, %s, %s, %s, NOW())
    """
    valores = (
        data["nome"],
        data.get("empresa", ""),
        data.get("contraton", ""),
        data.get("contratoprazo", ""),
        data.get("contratoresponsavel", ""),
        data["status"]
    )
    cursor.execute(query, valores)
    con.commit()
    novo_id = cursor.lastrowid
    cursor.close()
    con.close()
    return jsonify({"status": "ok", "id": novo_id})

@app.route("/API/obra/<int:id>", methods=["PUT"])
def atualizar_obra(id):
    data = request.json
    con = conectar()
    cursor = con.cursor()
    query = """
        UPDATE rdo_cad_obra
        SET nome=%s, empresa=%s, contraton=%s, contratoprazo=%s,
            contratoresponsavel=%s, status=%s
        WHERE id=%s
    """
    valores = (
        data["nome"],
        data.get("empresa", ""),
        data.get("contraton", ""),
        data.get("contratoprazo", ""),
        data.get("contratoresponsavel", ""),
        data["status"],
        id
    )
    cursor.execute(query, valores)
    con.commit()
    cursor.close()
    con.close()
    return jsonify({"status": "ok"})

@app.route("/API/obras", methods=["GET"])
def listar_obras_api():
    con = conectar()
    cursor = con.cursor(dictionary=True)
    cursor.execute("SELECT * FROM rdo_cad_obra ORDER BY id DESC")
    obras = cursor.fetchall()
    cursor.close()
    con.close()
    return jsonify(obras)

@app.route("/obra/<int:id>", methods=["DELETE"])
def excluir_obra(id):
    con = conectar()
    cursor = con.cursor()
    cursor.execute("DELETE FROM rdo_cad_obra WHERE id=%s", (id,))
    con.commit()
    cursor.close()
    con.close()
    return jsonify({"status": "ok"})

@app.route("/api_index/obras", methods=["GET"])
def listar_obras_telainicial_api():
    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, nome, contratoresponsavel, id, empresa, status
            FROM rdo_cad_obra
            ORDER BY id DESC
        """)
        obras = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(obras)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# ------------------------------------------
# ⚡ RDO (API)
# ------------------------------------------
@app.route("/API/rdo", methods=["POST"])
def criar_rdo():
    try:
        dados = request.json
        conn = conectar()
        cursor = conn.cursor()

        sql = """
            INSERT INTO rdo_rg_rdo
            (
                data, obra, cliente, responsavel, ncontrato, localobra,
                atividades, observacoes, status,

                mo_ajudante,
                mo_laminador,
                mo_soldadortemoplastico,
                mo_encarregado,
                mo_supervisor,
                mo_inspetorqualidade,
                mo_montador,
                mo_engenheiro,
                mo_ajudantet,
                mo_montadort,

                ocorrencia,
                comentario,
                status_atividade,
                usuario,

                dtregistro
            )
            VALUES (
                %s,%s,%s,%s,%s,%s,
                %s,%s,%s,

                %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,

                %s,%s,%s,%s,

                now()
            )
        """

        valores = (
            dados.get("data"),
            dados.get("obra"),
            dados.get("cliente"),
            dados.get("responsavel"),
            dados.get("ncontrato"),
            dados.get("localobra"),
            dados.get("atividades"),
            dados.get("observacoes"),
            dados.get("status"),

            dados.get("mo_ajudante"),
            dados.get("mo_laminador"),
            dados.get("mo_soldadortemoplastico"),
            dados.get("mo_encarregado"),
            dados.get("mo_supervisor"),
            dados.get("mo_inspetorqualidade"),
            dados.get("mo_montador"),
            dados.get("mo_engenheiro"),
            dados.get("mo_ajudantet"),
            dados.get("mo_montadort"),

            dados.get("ocorrencia"),
            dados.get("comentario"),
            dados.get("status_atividade"),
            dados.get("usuario"),
        )

        cursor.execute(sql, valores)
        conn.commit()

        return jsonify({"sucesso": True, "id": cursor.lastrowid}), 201

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@app.route("/API/rdo", methods=["GET"])
def listar_rdos():
    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM rdo_rg_rdo ORDER BY data DESC")
        rdos = cursor.fetchall()
        return jsonify(rdos), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500

@app.route("/API/rdo/<int:id>", methods=["GET"])
def buscar_rdo(id):
    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT *
            FROM rdo_rg_rdo
            WHERE id = %s
        """, (id,))
        rdo = cursor.fetchone()
        print(rdo)

        if not rdo:
            return jsonify({"erro": "RDO não encontrado"}), 404

        # ✅ CONVERSÃO CORRETA DA DATA
        if rdo.get("data"):
            rdo["data"] = rdo["data"].strftime("%Y-%m-%d")

        rdo["anexo"] = json.loads(rdo["anexo"]) if rdo["anexo"] else []

        return jsonify(rdo), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@app.route("/API/rdo/<int:id>", methods=["PUT"])
def atualizar_rdo(id):
    try:
        dados = request.json
        print(dados)

        conn = conectar()
        cursor = conn.cursor()

        sql = """
            UPDATE rdo_rg_rdo
            SET 
                data=%s,
                obra=%s,
                cliente=%s,
                responsavel=%s,
                ncontrato=%s,
                localobra=%s,
                atividades=%s,
                observacoes=%s,
                status=%s,

                mo_ajudante=%s,
                mo_laminador=%s,
                mo_soldadortemoplastico=%s,
                mo_encarregado=%s,
                mo_supervisor=%s,
                mo_inspetorqualidade=%s,
                mo_montador=%s,
                mo_engenheiro=%s,
                mo_ajudantet=%s,
                mo_montadort=%s,

                ocorrencia=%s,
                comentario=%s,
                status_atividade=%s,
                usuario=%s,

                dtatualizacao = now()
            WHERE id=%s
        """

        valores = (
            dados.get("data"),
            dados.get("obra"),
            dados.get("cliente"),
            dados.get("responsavel"),
            dados.get("ncontrato"),
            dados.get("localobra"),
            dados.get("atividades"),
            dados.get("observacoes"),
            dados.get("status"),

            dados.get("mo_ajudante"),
            dados.get("mo_laminador"),
            dados.get("mo_soldadortemoplastico"),
            dados.get("mo_encarregado"),
            dados.get("mo_supervisor"),
            dados.get("mo_inspetorqualidade"),
            dados.get("mo_montador"),
            dados.get("mo_engenheiro"),
            dados.get("mo_ajudantet"),
            dados.get("mo_montadort"),

            dados.get("ocorrencia"),
            dados.get("comentario"),
            dados.get("status_atividade"),
            dados.get("usuario"),

            id
        )

        cursor.execute(sql, valores)
        conn.commit()

        return jsonify({"sucesso": True}), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


@app.route("/API/rdo/<int:id>", methods=["DELETE"])
def excluir_rdo(id):
    try:
        conn = conectar()
        cursor = conn.cursor()
        cursor.execute("DELETE FROM rdo_rg_rdo WHERE id = %s", (id,))
        conn.commit()
        return jsonify({"sucesso": True}), 200
    except Exception as e:
        return jsonify({"erro": str(e)}), 500
    
@app.route("/api_index/rdos", methods=["GET"])
def listar_rdos_api():
    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("""
            SELECT id, obra, data, cliente, responsavel, ncontrato, localobra, atividades, observacoes, status
            FROM rdo_rg_rdo
            ORDER BY id DESC
        """)
        rdos = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(rdos)
    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# ------------------------------------------
# 🚀 RODAR SERVIDOR
# ------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
