from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
import json   # ← Necessário para tratar anexos

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
# PÁGINAS
# ------------------------------------------
@app.route("/")
def home():
    return send_from_directory('.', "index.html")

@app.route("/inicio")
def page_inicio():
    return send_from_directory('.', "inicio.html")

@app.route("/obras")
def page_obras():
    return send_from_directory('.', "obras.html")

@app.route("/rdo")
def page_rdo():
    return send_from_directory('.', "rdo.html")

@app.route("/usuario")
def page_usuario():
    return send_from_directory('.', "usuario.html")


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

    cursor.execute("""
        SELECT id, nome, email, cargo, perfilacesso, status 
        FROM rdo_cad_usuario 
        WHERE email=%s AND senha=%s
    """, (email, senha))

    usuario = cursor.fetchone()

    cursor.close()
    con.close()

    if usuario:
        return jsonify({"status": "ok", "usuario": usuario})
    else:
        return jsonify({"status": "erro", "mensagem": "Usuário ou senha incorretos"}), 401


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
        (nome, contato, cargo, email, senha, assinatura, perfilacesso, permissaoobra, status, dtcadastro)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,NOW())
    """

    valores = (
        data["nome"], data["contato"], data["cargo"], data["email"], data["senha"],
        data.get("assinatura", ""), data.get("perfilacesso", ""), 
        data.get("permissaoobra", ""), data["status"],
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
        assinatura=%s, perfilacesso=%s, permissaoobra=%s, status=%s,
        dtatualizacao=NOW()
        WHERE id=%s
    """

    valores = (
        data["nome"], data["contato"], data["cargo"], data["email"], data["senha"],
        data.get("assinatura", ""), data.get("perfilacesso", ""), 
        data.get("permissaoobra", ""), data["status"], id
    )

    cursor.execute(query, valores)
    con.commit()

    cursor.close()
    con.close()

    return jsonify({"status": "ok"})


@app.route("/usuarios", methods=["GET"])
def listar_usuarios():
    con = conectar()
    cursor = con.cursor(dictionary=True)

    cursor.execute("SELECT * FROM rdo_cad_usuario ORDER BY id DESC")
    resultado = cursor.fetchall()

    cursor.close()
    con.close()

    return jsonify(resultado)


# ------------------------------------------
# 🧱 OBRAS (Tabela correta: rdo_cad_obra)
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


# ------------------------------------------
# ⚠️ ROTAS DE OBRAS ANTIGAS (AJUSTADAS)
# ------------------------------------------
# ROTAS DE OBRAS -------------------------

@app.route("/obras", methods=["GET"])
def listar_obras():
    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("SELECT id, nome, contraton, responsavel, local FROM rdo_cad_obra")
        obras = cursor.fetchall()

        return jsonify(obras), 200

    except Error as e:
        return jsonify({"erro": str(e)}), 500
    finally:
        if conn.is_connected():
            cursor.close()
            conn.close()


@app.route("/obras/<int:id>", methods=["GET"])
def buscar_obra(id):
    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)

        # Seleciona somente os campos usados pelo frontend
        cursor.execute(
            """
            SELECT 
                id,
                nome,
                contraton,
                responsavel,
                local AS endereco
            FROM rdo_cad_obra
            WHERE id = %s
            """,
            (id,)
        )
        
        obra = cursor.fetchone()

        cursor.close()
        conn.close()

        if not obra:
            return jsonify({"erro": "Obra não encontrada"}), 404

        return jsonify(obra), 200

    except Exception as e:
        try:
            cursor.close()
            conn.close()
        except:
            pass
        return jsonify({"erro": str(e)}), 500



# --------------- CRIAR -----------------
@app.route("/rdo", methods=["POST"])
def criar_rdo():
    try:
        dados = request.json
        conn = conectar()
        cursor = conn.cursor()

        sql = """
            INSERT INTO rdo_rg_rdo
            (data, obra, cliente, responsavel, NContrato, localObra,
             atividades, observacoes, status)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """

        valores = (
            dados.get("data"),
            dados.get("obra"),
            dados.get("cliente"),
            dados.get("responsavel"),
            dados.get("NContrato"),
            dados.get("localObra"),
            dados.get("atividades"),
            dados.get("observacoes"),
            dados.get("status"),
        )

        cursor.execute(sql, valores)
        conn.commit()

        return jsonify({"sucesso": True, "id": cursor.lastrowid}), 201

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# --------------- LISTAR TODOS -----------------
@app.route("/rdo", methods=["GET"])
def listar_rdos():
    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, data, obra, cliente, responsavel, NContrato,
                   localObra, atividades, observacoes, status, anexo
            FROM rdo_rg_rdo
            ORDER BY id DESC
        """)

        rdos = cursor.fetchall()

        return jsonify(rdos), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# --------------- BUSCAR ÚNICO -----------------
@app.route("/rdo/<int:id>", methods=["GET"])
def buscar_rdo(id):
    try:
        conn = conectar()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT id, data, obra, cliente, responsavel, NContrato,
                   localObra, atividades, observacoes, status, anexo
            FROM rdo_rg_rdo
            WHERE id = %s
        """, (id,))

        rdo = cursor.fetchone()
        if not rdo:
            return jsonify({"erro": "RDO não encontrado"}), 404

        rdo["anexo"] = json.loads(rdo["anexo"]) if rdo["anexo"] else []

        return jsonify(rdo), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# --------------- ATUALIZAR -----------------
@app.route("/rdo/<int:id>", methods=["PUT"])
def atualizar_rdo(id):
    try:
        dados = request.json
        conn = conectar()
        cursor = conn.cursor()

        sql = """
            UPDATE rdo_rg_rdo
            SET data=%s, obra=%s, cliente=%s, responsavel=%s,
                NContrato=%s, localObra=%s, atividades=%s,
                observacoes=%s, status=%s, anexo=%s
            WHERE id=%s
        """

        valores = (
            dados.get("data"),
            dados.get("obra"),
            dados.get("cliente"),
            dados.get("responsavel"),
            dados.get("NContrato"),
            dados.get("localObra"),
            dados.get("atividades"),
            dados.get("observacoes"),
            dados.get("status"),
            json.dumps(dados.get("anexo", [])),
            id
        )

        cursor.execute(sql, valores)
        conn.commit()

        return jsonify({"sucesso": True}), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500


# --------------- DELETAR -----------------
@app.route("/rdo/<int:id>", methods=["DELETE"])
def excluir_rdo(id):
    try:
        conn = conectar()
        cursor = conn.cursor()

        cursor.execute("DELETE FROM rdo_rg_rdo WHERE id = %s", (id,))
        conn.commit()

        return jsonify({"sucesso": True}), 200

    except Exception as e:
        return jsonify({"erro": str(e)}), 500




# ------------------------------------------
# 🚀 RODAR SERVIDOR
# ------------------------------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
