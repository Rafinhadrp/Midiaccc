# Ministério de Multimídia

Sistema de inscrição e administração: formulário público, aprovação com mensagem
automática, escalas, membros com foto de perfil e controle de permissões.

Next.js 15 (App Router) + Supabase (Postgres, Auth, Storage) + Resend + WhatsApp.

---

## 1. Instalar

```bash
npm install
cp .env.example .env.local
```

## 2. Criar o projeto no Supabase

1. Crie um projeto em supabase.com
2. Abra **SQL Editor**, cole todo o conteúdo de `supabase/schema.sql` e rode
3. Vá em **Project Settings > API** e copie para o `.env.local`:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

> A chave `service_role` ignora todas as regras de segurança do banco.
> Ela só pode existir no servidor. Nunca coloque o prefixo `NEXT_PUBLIC_` nela.

## 3. Criar seu usuário de líder

Em **Authentication > Users > Add user**, crie seu usuário com e-mail e senha.
Depois rode no SQL Editor, trocando o e-mail e o nome:

```sql
insert into perfis (id, nome, email, papel_id)
select id, 'Seu Nome', email, 'lider' from auth.users
where email = 'voce@suaigreja.com.br'
on conflict (id) do update set papel_id = 'lider';
```

## 4. Configurar o tempo de sessão

Em **Authentication > Sessions**:

- **Time-box user sessions**: `720 hours` (30 dias) — é o logout mensal
- **Inactivity timeout**: deixe vazio, para quem usa não ser deslogado sozinho

Isso é o que faz a pessoa continuar logada como no Instagram, mas ter que
digitar a senha uma vez por mês.

## 5. E-mail (Resend)

1. Crie conta em resend.com
2. Em **Domains**, adicione `seudominio.com.br` e cadastre no seu DNS os
   registros SPF e DKIM que aparecerem
3. Copie a API key para `RESEND_API_KEY`
4. Preencha `EMAIL_REMETENTE`, por exemplo:
   `"Ministério de Multimídia <multimidia@seudominio.com.br>"`

Enquanto o domínio não estiver verificado, a Resend só entrega para o seu
próprio e-mail. Isso é normal.

## 6. WhatsApp

Escolha um caminho em `WHATSAPP_PROVIDER`.

### `cloud` — API oficial da Meta (recomendado)

1. Crie um app em developers.facebook.com, produto **WhatsApp**
2. Pegue o **Phone number ID** → `WHATSAPP_PHONE_ID`
3. Gere um token permanente pelo System User → `WHATSAPP_TOKEN`
4. Em **Message Templates**, crie dois templates de categoria **Utilidade**:

   `inscricao_aprovada`, com 3 variáveis:
   ```
   Olá, {{1}}! Sua inscrição no Ministério de Multimídia foi aprovada.
   Função: {{2}}
   Crie sua senha de acesso aqui: {{3}}
   ```

   `inscricao_recusada`, com 1 variável:
   ```
   Olá, {{1}}! Obrigado por se inscrever no Ministério de Multimídia.
   No momento não temos vaga, mas guardamos seu cadastro e avisamos na próxima turma.
   ```

5. Coloque os nomes em `WHATSAPP_TEMPLATE_APROVADO` e `WHATSAPP_TEMPLATE_RECUSADO`

O número usado aqui precisa ser exclusivo, não pode estar ativo no app comum
do WhatsApp.

### `evolution` — self-hosted, número comum

Roda naquele servidor que já fica ligado:

```bash
docker run -d --name evolution -p 8080:8080 \
  -e AUTHENTICATION_API_KEY=sua-chave \
  atendai/evolution-api:latest
```

Crie a instância, leia o QR code com o celular e preencha `EVOLUTION_URL`,
`EVOLUTION_INSTANCE` e `EVOLUTION_APIKEY`.

Funciona sem template e sem burocracia, mas **viola os termos do WhatsApp** e o
número pode ser bloqueado. Use um chip separado, nunca o número principal da igreja.

### `off`

Só e-mail. É um começo perfeitamente razoável.

## 7. Rodar

```bash
npm run dev
```

- `http://localhost:3000/inscrever` — formulário público
- `http://localhost:3000/login` — entrada dos administradores
- `http://localhost:3000/painel` — painel

## 8. Publicar no subdomínio

1. Suba o código para o GitHub
2. Importe o repositório na Vercel e cole todas as variáveis do `.env.local`
3. Em **Settings > Domains**, adicione `multimidia.seudominio.com.br`
4. No DNS do seu domínio, crie um `CNAME` de `multimidia` apontando para
   `cname.vercel-dns.com`
5. Ajuste `NEXT_PUBLIC_SITE_URL` para o endereço final
6. No Supabase, em **Authentication > URL Configuration**, coloque o mesmo
   endereço em **Site URL** e em **Redirect URLs**

---

## Como o fluxo funciona

**Inscrição.** O formulário público envia para `/api/inscricoes`. A gravação
acontece no servidor com a service role, então a tabela fica completamente
fechada para quem não está logado. A foto é validada, limitada a 3 MB e enviada
para o Storage.

**Aprovação.** Ao clicar em Aprovar, `/api/inscricoes/[id]/decisao`:

1. confere se você tem a permissão `inscricoes:aprovar`
2. cria o usuário no Auth e o perfil, já com as funções escolhidas
3. gera um link para a pessoa criar a própria senha
4. dispara a mensagem pelo canal escolhido
5. registra tudo na tabela `notificacoes`, inclusive se deu erro

Se a mensagem falhar, a decisão fica salva e o erro aparece na tela e no painel.
Ninguém fica aprovado em silêncio.

**Permissões.** Toda regra vive no banco, na função `tem_permissao()`, usada
pelas políticas de RLS. Esconder o botão na tela é só conforto: mesmo que alguém
chame a API na mão, o Postgres recusa.

**Senhas.** O sistema nunca toca nelas. Quem guarda é o Supabase Auth, com hash
bcrypt. Não existe lugar nenhum onde você consiga ver a senha de alguém, e isso
é proposital.

## Estrutura

```
app/
  inscrever/      formulário público
  login/          entrada
  painel/         painel, inscrições, escalas, membros, acessos
  api/            recebimento da inscrição e decisão
components/       telas e avatar
lib/
  supabase/       clientes (navegador, servidor, service role)
  envio/          e-mail e WhatsApp
  permissoes.js   perfil logado e checagem
supabase/
  schema.sql      tabelas, RLS, storage, dados iniciais
```

## Próximos passos naturais

- Lembrete automático no sábado para quem está escalado no domingo
- Tela de indisponibilidade (a tabela já existe no schema)
- Sugestão automática de escala, evitando quem serviu no culto anterior
