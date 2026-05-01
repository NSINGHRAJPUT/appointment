import { ArrowLeft, ArrowRight } from "lucide-react";

export default function BlogsPage() {
  return (
    <>
      <main className="grow pt-24 pb-xl px-margin max-w-container-max mx-auto w-full">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-sm mb-lg">
          <button className="px-4 py-2 bg-primary-container text-on-primary-container rounded-full font-label-sm text-label-sm transition-colors border border-transparent">
            All Articles
          </button>
          <button className="px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container-highest rounded-full font-label-sm text-label-sm transition-colors border border-outline-variant">
            Health Tips
          </button>
          <button className="px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container-highest rounded-full font-label-sm text-label-sm transition-colors border border-outline-variant">
            Doctor Interviews
          </button>
          <button className="px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container-highest rounded-full font-label-sm text-label-sm transition-colors border border-outline-variant">
            Technology
          </button>
          <button className="px-4 py-2 bg-surface-container-low text-on-surface hover:bg-surface-container-highest rounded-full font-label-sm text-label-sm transition-colors border border-outline-variant">
            Research
          </button>
        </div>
        {/* Featured Article */}
        <div className="mb-xl">
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)] flex flex-col md:flex-row">
            <div className="md:w-1/2 relative h-64 md:h-auto overflow-hidden">
              <img
                alt="Featured article image"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                data-alt="Modern medical laboratory with advanced technological equipment, soft blue lighting, professional and clean environment"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxWsEkk7rp9_oFVRd7-hEPB6is2d0q14wu58AWGAbC-DNXcXIu2GJA2LCLUVXoy-BS5iE0XKZkENwFYIWedyo06mt2jkM_KmZ2HuKuSLtuRvDeq-g5D9wVIalhXqpIbJ2F5W1oTSSuWf41NZAQWDLnLReZKN9X7b88EYsRkTbik9k8nKhPQHjREDXdXDGElfBzrZBt6Yx5Rf_H2WrcS5eHJrR3e6VEi266p-t0YrAoUn8sfuDkp35RW8ekcmO8okphRT0YpL5uAIth"
              />
            </div>
            <div className="md:w-1/2 p-lg md:p-xl flex flex-col justify-center">
              <div className="flex items-center gap-2 mb-md">
                <span className="px-2 py-1 bg-secondary-container/20 text-primary font-label-xs text-label-xs uppercase rounded">
                  Technology
                </span>
                <span className="text-on-surface-variant font-label-sm text-label-sm flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">
                    schedule
                  </span>{" "}
                  8 min read
                </span>
              </div>
              <h2 className="font-h1 text-h1 text-on-surface mb-sm group-hover:text-primary transition-colors">
                The Future of AI in Preventative Healthcare
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
                Discover how machine learning algorithms are revolutionizing
                early detection protocols and improving patient outcomes in
                high-stakes clinical environments.
              </p>
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-surface-container overflow-hidden">
                    <img
                      alt="Dr. Sarah Jenkins"
                      className="w-full h-full object-cover"
                      data-alt="Portrait of a female doctor in a white coat, smiling professionally in a bright clinical setting"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuBJ9hXNAm7RcFOfGgX8o5IGtdlknvtfANRXPx4tMzeXFMMn3UNZ1nNTSagm1Yvk_CZQd3Pe6gpURleVS2rODNec1jG7K97QWgwhu31mYlSgHtrrdS2oo3eiSaX7CTDwId2RTmVhj0i1olya6LU1MVR1EdwhYQa3PN-SQaiOtSNOurQ3TQqFvZ9RYP3tsCZzQ93jkrgHK8KDBGgYkQLzwIhGpTNUar82_7CU5N4BJBpAxq8F4Zr_b4OzU811-fH62oaxUH1B1cAqAq9H"
                    />
                  </div>
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface">
                      Dr. Sarah Jenkins
                    </p>
                    <p className="font-label-xs text-label-xs text-on-surface-variant">
                      Chief Medical Officer
                    </p>
                  </div>
                </div>
                <span className="text-primary font-label-sm text-label-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                  Read Article{" "}
                  <span className="material-symbols-outlined text-[16px]">
                    <ArrowRight size={16} />
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Article Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-gutter">
          {/* Card 1 */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="relative h-48 overflow-hidden">
              <img
                alt="Doctor Interview"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                data-alt="Doctor consulting with patient in a bright modern office, professional and empathetic interaction"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuD60PQh4LMlSUjVPb3RxuNdy1qIgqaxhh-lEXyDlj5KmxpiLn-6vI8ERXy8qQf891jQMLEgfbnNSLO5lXrmJDrK6W0q_xgUnpXwb_vBW2TFJatCEqL0fiFKCusa5yksX1MYnqVhOYYvSibBcLva_-LDoaMGtCaFGtLNq8FJJfCFi1Ql0i9n17NIabRgOO-I_0ZIxuXGpgG8AlN7VZD6uLVVmc3TJUVTorYmVG7sGxdAHormhbu9y06rKnBRz6M4kgxBfBc2EgwsSI5V"
              />
              <div className="absolute top-4 left-4">
                <span className="px-2 py-1 bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-label-xs text-label-xs uppercase rounded">
                  Doctor Interviews
                </span>
              </div>
            </div>
            <div className="p-lg flex flex-col grow">
              <div className="flex items-center gap-2 mb-sm text-on-surface-variant font-label-sm text-label-sm">
                <span>Oct 12, 2023</span>
                <span>•</span>
                <span>5 min read</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-sm group-hover:text-primary transition-colors">
                Understanding Patient-Centric Care Models
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg grow">
                An exclusive interview with Dr. Chen on implementing holistic
                approaches to chronic disease management.
              </p>
              <div className="mt-auto pt-md border-t border-surface-variant flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface">
                  By Editorial Team
                </span>
                <span className="text-primary font-label-sm text-label-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read{" "}
                  <span className="material-symbols-outlined text-[16px]">
                    <ArrowRight size={14} />
                  </span>
                </span>
              </div>
            </div>
          </div>
          {/* Card 2 */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="relative h-48 overflow-hidden">
              <img
                alt="Health Tips"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                data-alt="Healthy lifestyle flat lay with fresh vegetables, stethoscope, and notebook on white background"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBFjTkphuqxiwRNAvZqzzEMiMRgENWeT-vWplD3o0WYdUhznZIxTiD_f2fDmYricI7g1O0Tmz0B-1w5TjOxWO_hfqlSCFQe9E1zQukhMTcNpsnlgyxQDKFSDDd6FtgU0qYorC7YtLD8ZmjJtq-p3CHpyjh6uWlQfHWqfeEyDH_yDrmG93hKkCkQevW_sm_0-1PCGeR6-rzFGHayQ6kN3dxxB4t2mEAG_T58osJCwI-__yP-f-dJllIHtDnEg6OTWl73pv07T2fYVnq7"
              />
              <div className="absolute top-4 left-4">
                <span className="px-2 py-1 bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-label-xs text-label-xs uppercase rounded">
                  Health Tips
                </span>
              </div>
            </div>
            <div className="p-lg flex flex-col grow">
              <div className="flex items-center gap-2 mb-sm text-on-surface-variant font-label-sm text-label-sm">
                <span>Oct 05, 2023</span>
                <span>•</span>
                <span>4 min read</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-sm group-hover:text-primary transition-colors">
                Nutrition Protocols for Enhanced Recovery
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg grow">
                Evidence-based dietary adjustments that can accelerate
                post-operative healing and boost immune function.
              </p>
              <div className="mt-auto pt-md border-t border-surface-variant flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface">
                  By Amanda Reyes, RD
                </span>
                <span className="text-primary font-label-sm text-label-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read{" "}
                  <span className="material-symbols-outlined text-[16px]">
                    <ArrowRight size={14} />
                  </span>
                </span>
              </div>
            </div>
          </div>
          {/* Card 3 */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="relative h-48 overflow-hidden">
              <img
                alt="Technology"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                data-alt="Close up of a modern medical tablet device displaying patient data graphs in a clinical setting"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAtG0OjwaH7uYw10YpUSt0ei9EFU4Q3-nH-h3qRN1Gy-ERfQ0sAIQvsg1wYVKrfdxjp9K73wOLYpOlBkN0hpVv9BLaNX10hN5VYawJnXd2MXL6fc2YuEdIYGXlAU7IOXRS_i_HUuZ07OYSdup6s2JoW-5OJH28h600UO_nIqH4j4ID9n_9JJB68zbVxjXVoLk3vSog4t9Qbg2cF-7zcFraK5ROXX3T1hC9nEuZWl7Ec9XWkc3A_lml0XBWsQyYCej-g3_PvzyqBzhA-"
              />
              <div className="absolute top-4 left-4">
                <span className="px-2 py-1 bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-label-xs text-label-xs uppercase rounded">
                  Technology
                </span>
              </div>
            </div>
            <div className="p-lg flex flex-col grow">
              <div className="flex items-center gap-2 mb-sm text-on-surface-variant font-label-sm text-label-sm">
                <span>Sep 28, 2023</span>
                <span>•</span>
                <span>6 min read</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-sm group-hover:text-primary transition-colors">
                Telehealth Integration Best Practices
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg grow">
                Optimizing remote patient monitoring systems to ensure
                continuous care without compromising data security.
              </p>
              <div className="mt-auto pt-md border-t border-surface-variant flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface">
                  By Marcus Cole
                </span>
                <span className="text-primary font-label-sm text-label-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read{" "}
                  <span className="material-symbols-outlined text-[16px]">
                    <ArrowRight size={14} />
                  </span>
                </span>
              </div>
            </div>
          </div>
          {/* Card 4 */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="relative h-48 overflow-hidden">
              <img
                alt="Research"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                data-alt="Microscope lenses close up in a modern sterile laboratory setting, scientific research focus"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAAyGwxB1CsuS4b-cgBXfet5uS7qXlKzR7zvBC9P6krhDub8j99xK9oCskbJ8EFjJq_FDy4rKSfY-lbA5NXZXIiXeHikTfQBhBe_Rekt3eZwJKsRiAe2gKnR0MknDjZmjlYWjCykx5EjAE2ciaBHsTm_c2ibbFt22TikahXLIy4uPJU2lnuN5_omeIYafeh2ELp-YusZZIjQcDiw5C3q6n_pYkCw4FzLJ3ccE_QzcS67KJPx2ydrRC-dVQkKelGcM93N0Bz64UOo5jH"
              />
              <div className="absolute top-4 left-4">
                <span className="px-2 py-1 bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-label-xs text-label-xs uppercase rounded">
                  Research
                </span>
              </div>
            </div>
            <div className="p-lg flex flex-col grow">
              <div className="flex items-center gap-2 mb-sm text-on-surface-variant font-label-sm text-label-sm">
                <span>Sep 15, 2023</span>
                <span>•</span>
                <span>10 min read</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-sm group-hover:text-primary transition-colors">
                Advancements in Targeted Therapies
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg grow">
                A review of recent clinical trials focusing on precision
                medicine and individualized treatment plans.
              </p>
              <div className="mt-auto pt-md border-t border-surface-variant flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface">
                  By Dr. Emily Thorne
                </span>
                <span className="text-primary font-label-sm text-label-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read{" "}
                  <span className="material-symbols-outlined text-[16px]">
                    <ArrowRight size={14} />
                  </span>
                </span>
              </div>
            </div>
          </div>
          {/* Card 5 */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="relative h-48 overflow-hidden">
              <img
                alt="Health Tips"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                data-alt="Doctor's hands holding a modern heart model, explaining cardiovascular health concepts"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuC5l4wFsvXH7HPwOu60Zo3MuFHRDMZa3bMidlPbcPxOGoA-Qma2_7QjpgOYafDkAmdTM0_H0WE8v-qzoHZukHdV_q77RoAe7Pv8G65XwAS3EH0aYkctunkyhM4Ygp8uYGrkoYTGHmUjcjdV0rLif5vgNga1B8jh_AHeVbJONSA7UAR3_0ZYgx9ml62q0hj6fbG7Vq4Y2t-vgt_pCmwTpk7TrfU3jNvknueRsiWLPx74EsZXkHYfvlxdsK-4PZcabreI2LqPqQPKxVr-"
              />
              <div className="absolute top-4 left-4">
                <span className="px-2 py-1 bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-label-xs text-label-xs uppercase rounded">
                  Health Tips
                </span>
              </div>
            </div>
            <div className="p-lg flex flex-col grow">
              <div className="flex items-center gap-2 mb-sm text-on-surface-variant font-label-sm text-label-sm">
                <span>Sep 02, 2023</span>
                <span>•</span>
                <span>3 min read</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-sm group-hover:text-primary transition-colors">
                Cardiovascular Baseline Screenings
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg grow">
                Why establishing early baselines is critical for long-term heart
                health management in adult patients.
              </p>
              <div className="mt-auto pt-md border-t border-surface-variant flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface">
                  By Editorial Team
                </span>
                <span className="text-primary font-label-sm text-label-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read{" "}
                  <span className="material-symbols-outlined text-[16px]">
                    <ArrowRight size={14} />
                  </span>
                </span>
              </div>
            </div>
          </div>
          {/* Card 6 */}
          <div className="bg-surface-container-lowest rounded-xl border border-surface-variant overflow-hidden group cursor-pointer transition-all duration-300 hover:shadow-[0_4px_6px_-1px_rgba(13,148,136,0.05),0_2px_4px_-2px_rgba(0,0,0,0.02)] flex flex-col">
            <div className="relative h-48 overflow-hidden">
              <img
                alt="Doctor Interviews"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                data-alt="Abstract view of modern medical building architecture with glass windows and clean lines"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDQelT-OI3LKN0lhhq7D9qQknnF8yA4TTgqaKSqI8dwrzFGDqTIzKnn327-z1G_7bZ5_yDWGzUklaZaUXs8UBf_WO-VCUKpeo9PHQSSyMyBJDOygaaKJrlRIoCI6XLGo0juvPvqQPIJpZoceenLIvCAyULDGqrx2M0hsBP0fA69soSzy8_LIuOoewZnaVnxHtu8PmzaonVuObg1fYRQU01BTp_uBbK9AKM8UGlKN7-agWCrRU-jjPpY1JapASMxyskY_fWi5rXAy-cx"
              />
              <div className="absolute top-4 left-4">
                <span className="px-2 py-1 bg-surface-container-lowest/90 backdrop-blur-sm text-primary font-label-xs text-label-xs uppercase rounded">
                  Doctor Interviews
                </span>
              </div>
            </div>
            <div className="p-lg flex flex-col grow">
              <div className="flex items-center gap-2 mb-sm text-on-surface-variant font-label-sm text-label-sm">
                <span>Aug 24, 2023</span>
                <span>•</span>
                <span>7 min read</span>
              </div>
              <h3 className="font-h3 text-h3 text-on-surface mb-sm group-hover:text-primary transition-colors">
                Building the Clinic of Tomorrow
              </h3>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg grow">
                Insights from lead architects and medical directors on designing
                spaces that promote healing and efficiency.
              </p>
              <div className="mt-auto pt-md border-t border-surface-variant flex items-center justify-between">
                <span className="font-label-sm text-label-sm text-on-surface">
                  By James West
                </span>
                <span className="text-primary font-label-sm text-label-sm flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                  Read{" "}
                  <span className="material-symbols-outlined text-[16px]">
                    <ArrowRight size={14} />
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
        {/* Pagination */}
        <div className="mt-xl flex justify-center items-center gap-2">
          <button
            className="w-10 h-10 flex items-center justify-center rounded-lg border border-surface-variant text-on-surface-variant hover:bg-surface-container transition-colors disabled:opacity-50"
            disabled
          >
            <span className="material-symbols-outlined">
              <ArrowLeft size={14} />
            </span>
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg bg-primary text-on-primary font-label-sm text-label-sm">
            1
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-surface-variant text-on-surface hover:bg-surface-container transition-colors font-label-sm text-label-sm">
            2
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-surface-variant text-on-surface hover:bg-surface-container transition-colors font-label-sm text-label-sm">
            3
          </button>
          <span className="text-on-surface-variant">...</span>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-surface-variant text-on-surface hover:bg-surface-container transition-colors font-label-sm text-label-sm">
            8
          </button>
          <button className="w-10 h-10 flex items-center justify-center rounded-lg border border-surface-variant text-on-surface hover:bg-surface-container transition-colors">
            <span className="material-symbols-outlined">
              {" "}
              <ArrowRight size={14} />
            </span>
          </button>
        </div>
      </main>
    </>
  );
}
