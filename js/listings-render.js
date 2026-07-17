/**
 * Renders listings from src/data/listings.js into page containers.
 * Edit listings.js only — this file stays as-is.
 */
(function () {
  function statusLabel(status, headline) {
    if (headline) return headline;
    if (status === "under_contract") return "Under Contract";
    if (status === "sold") return "Sold";
    return "Now Available";
  }

  function escapeHtml(str) {
    return String(str == null ? "" : str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function renderComingSoonCard(listing) {
    var featuredClass = listing.featured ? " cs-card-featured" : "";
    var badgeClass = listing.featured ? " cs-badge-feature" : "";
    var ctaClass = listing.featured ? " cs-card-cta cs-card-cta-feature" : " cs-card-cta";
    var specs = (listing.specs || [])
      .map(function (s) {
        return (
          "<span><strong>" +
          escapeHtml(s.value) +
          "</strong> " +
          escapeHtml(s.label) +
          "</span>"
        );
      })
      .join("");
    var features = (listing.features || [])
      .map(function (f) {
        return '<span class="cs-feature">' + escapeHtml(f) + "</span>";
      })
      .join("");
    var tagline = listing.tagline
      ? '<div class="cs-card-tagline">' + escapeHtml(listing.tagline) + "</div>"
      : "";

    return (
      '<article class="cs-card' +
      featuredClass +
      '">' +
      '<div class="cs-card-badge' +
      badgeClass +
      '">' +
      escapeHtml(statusLabel(listing.status, listing.headline)) +
      "</div>" +
      '<div class="cs-card-photo">' +
      '<img src="' +
      escapeHtml(listing.image) +
      '" alt="' +
      escapeHtml(listing.imageAlt || listing.address) +
      '">' +
      "</div>" +
      '<div class="cs-card-body">' +
      '<div class="cs-card-price">' +
      escapeHtml(listing.price) +
      "</div>" +
      '<div class="cs-card-address">' +
      escapeHtml(listing.address) +
      "</div>" +
      tagline +
      '<div class="cs-card-specs">' +
      specs +
      "</div>" +
      '<p class="cs-card-desc">' +
      escapeHtml(listing.subheadline) +
      "</p>" +
      '<div class="cs-card-features">' +
      features +
      "</div>" +
      '<a href="' +
      escapeHtml(listing.ctaHref || "contact.html") +
      '" class="' +
      ctaClass.trim() +
      '">' +
      escapeHtml(listing.cta) +
      "</a>" +
      "</div>" +
      "</article>"
    );
  }

  function renderSearchFeatured(listing) {
    var specs = (listing.specs || [])
      .map(function (s) {
        return (
          "<span><strong>" +
          escapeHtml(s.value) +
          "</strong><small>" +
          escapeHtml(s.label) +
          "</small></span>"
        );
      })
      .join("");

    var secondary = "";
    if (listing.secondaryCta && listing.secondaryCtaHref) {
      secondary =
        '<a href="' +
        escapeHtml(listing.secondaryCtaHref) +
        '" target="_blank" rel="noopener" class="btn-cta">' +
        escapeHtml(listing.secondaryCta) +
        "</a>";
    }

    return (
      '<div class="featured-listing">' +
      '<div class="featured-listing-grid">' +
      '<div class="featured-photo" style="background-image:url(\'' +
      escapeHtml(listing.image) +
      "');background-size:cover;background-position:center\">" +
      '<span class="featured-badge">' +
      escapeHtml(statusLabel(listing.status, listing.headline)) +
      "</span>" +
      "</div>" +
      '<div class="featured-body">' +
      '<div class="price">' +
      escapeHtml(listing.price) +
      "</div>" +
      '<div class="addr">' +
      escapeHtml(listing.address) +
      "</div>" +
      '<div class="specs">' +
      specs +
      "</div>" +
      '<p style="font-size:14px;color:var(--slate);line-height:1.6;margin-bottom:20px">' +
      escapeHtml(listing.subheadline) +
      "</p>" +
      secondary +
      '<a href="' +
      escapeHtml(listing.ctaHref || "contact.html") +
      '" class="btn-cta gold" style="margin-left:10px">' +
      escapeHtml(listing.cta) +
      "</a>" +
      "</div>" +
      "</div>" +
      "</div>"
    );
  }

  function forPage(page) {
    return (window.LISTINGS || []).filter(function (l) {
      return (l.showOn || []).indexOf(page) !== -1;
    });
  }

  function mount() {
    var homeEl = document.getElementById("listings-coming-soon");
    if (homeEl) {
      homeEl.innerHTML = forPage("home")
        .map(renderComingSoonCard)
        .join("\n");
    }

    var searchEl = document.getElementById("listings-featured");
    if (searchEl) {
      searchEl.innerHTML = forPage("search")
        .map(renderSearchFeatured)
        .join("\n");
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
