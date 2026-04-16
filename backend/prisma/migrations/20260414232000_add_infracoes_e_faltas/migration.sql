-- Add disciplinary control for students
ALTER TABLE "Aluno"
ADD COLUMN "faltas" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "Infracao" (
    "id" TEXT NOT NULL,
    "alunoId" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoPor" TEXT,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Infracao_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Infracao"
ADD CONSTRAINT "Infracao_alunoId_fkey"
FOREIGN KEY ("alunoId") REFERENCES "Aluno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "Infracao_alunoId_idx" ON "Infracao"("alunoId");
CREATE INDEX "Infracao_data_idx" ON "Infracao"("data");
