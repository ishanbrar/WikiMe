"use client";

/** Mini infobox frame showing how the cropped headshot appears in the article. */
export function HeadshotInfoboxPreview({
  imageUrl,
  name = "Subject",
}: {
  imageUrl: string;
  name?: string;
}) {
  return (
    <div className="headshot-infobox-preview" aria-label="Infobox preview">
      <p className="headshot-infobox-preview-label">Infobox preview</p>
      <table className="headshot-infobox-preview-table">
        <caption className="headshot-infobox-preview-title">{name}</caption>
        <tbody>
          <tr>
            <td colSpan={2} className="headshot-infobox-preview-image-cell">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="headshot-infobox-preview-image" />
              <p className="headshot-infobox-preview-caption">Your photo</p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
