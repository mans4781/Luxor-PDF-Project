from pathlib import Path

import fitz


source = Path("attached_assets/0_Jinko_JKM570-590N-72HL4-BDV_Datasheet_1787749202701.pdf")
output = Path(".agents/outputs/jinko-datasheet-page-1.png")
output.parent.mkdir(parents=True, exist_ok=True)

document = fitz.open(source)
page = document.load_page(0)
page.get_pixmap(matrix=fitz.Matrix(2, 2), alpha=False).save(output)

print(
    {
        "pages": document.page_count,
        "encrypted": document.needs_pass,
        "output": str(output),
    }
)