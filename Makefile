deploy:
	rsync -av index.html emerald.js emerald.css ajax-loader.gif jquery* hammer* www@quimby.gnus.org:html/circus/emerald/
