# Add the BASE Terminal keyboard shortcut to every generated HTML page.
Jekyll::Hooks.register :site, :post_render do |site|
  script = '<script src="/assets/js/base-terminal-shortcut.js?v=3" defer></script>'

  site.pages.each do |page|
    next unless page.output_ext == '.html'
    next unless page.output.include?('</body>')
    next if page.output.include?('base-terminal-shortcut.js')

    page.output = page.output.sub('</body>', "#{script}\n</body>")
  end

  site.posts.docs.each do |post|
    next unless post.output.include?('</body>')
    next if post.output.include?('base-terminal-shortcut.js')

    post.output = post.output.sub('</body>', "#{script}\n</body>")
  end
end