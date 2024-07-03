<img width="800" alt="character-maker-banner" src="https://github.com/leey00nsu/syu-character-maker/assets/101182523/b5298e27-0d45-4373-b763-d11f46df3fb5">

# [나만의 수야 수호 만들기](https://character-maker.l37.store/)

> 나만의 수야 수호 만들기는 삼육대학교 마스코트인 수야, 수호를 꾸밀 수 있는 프로그램입니다.

[API DOCS](https://character-maker-api.l37.store/api)

## Backend

### Tech

- nest.js
- postgresql
- redis
- typescript
- prisma

### 프로젝트 구조

<img width="3697" alt="syu-character-maker 구조" src="https://github.com/leey00nsu/syu-character-maker/assets/101182523/0b8681d4-2592-4099-ae97-34b81527cce6">

### ERD

```mermaid
erDiagram
"article" {
  Int id PK
  String canvasName
  String imageUrl
  DateTime createdAt
  Int authorId FK "nullable"
}
"liked_by" {
  Int id PK
  Int userId FK
  Int articleId FK
}
"user" {
  Int id PK
  String provider
  String providerId
  String name
  String email
  String photo
}
"article" }o--o| "user" : user
"liked_by" }o--|| "article" : article
"liked_by" }o--|| "user" : user
```
